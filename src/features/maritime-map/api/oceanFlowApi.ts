// Fetches a world grid of wind + ocean-current vectors from Open-Meteo
// (free, keyless — https://open-meteo.com) for the click-toggled particle
// overlay. Grid density is a fixed world box, not the current viewport, so
// the fetch only ever needs to happen once per session — see useOceanFlow.ts.

import type { FlowGrid, FlowGridPoint, OceanFlowGrids } from '../types/oceanFlowTypes';

const GRID_COLS = 24;
const GRID_ROWS = 14;
/** Stops short of the poles: lon/lat -> meters conversion blows up as cos(lat) -> 0, and there's no wind/current data there anyway. */
const LON_MIN = -180;
const LON_MAX = 180;
const LAT_MIN = -60;
const LAT_MAX = 75;
/** Open-Meteo accepts many comma-separated locations per request; stay well under its ~100 limit. */
const CHUNK_SIZE = 90;

const WIND_API_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';

/**
 * Open-Meteo's per-minute quota (600 calls) is nowhere near what a handful of
 * chunk requests would use, but firing them all at once still regularly gets
 * 429'd — that's a short-window burst limiter, not the quota itself. Spacing
 * requests out and retrying a 429 with backoff clears both problems without
 * cutting grid resolution.
 */
const REQUEST_STAGGER_MS = 220;
const MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 1200;

interface GridCoordinate {
  longitude: number;
  latitude: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries a 429 with backoff (honoring Retry-After when the server sends one); any other non-OK status fails immediately. */
async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response;
    if (response.status !== 429 || attempt === MAX_RETRIES) return response;

    const retryAfterHeader = Number(response.headers.get('retry-after'));
    const delayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : RETRY_BASE_DELAY_MS * 2 ** attempt;
    await sleep(delayMs);
  }
  // Unreachable — the loop always returns by the final attempt.
  return fetch(url);
}

/**
 * Runs async chunk tasks with their start times staggered by `REQUEST_STAGGER_MS`
 * instead of firing them all in one burst, while still resolving together.
 */
function runStaggered<T>(tasks: Array<() => Promise<T>>): Promise<T>[] {
  return tasks.map((task, i) => sleep(i * REQUEST_STAGGER_MS).then(task));
}

function buildGridCoordinates(): GridCoordinate[] {
  const coords: GridCoordinate[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const latitude = LAT_MIN + (row * (LAT_MAX - LAT_MIN)) / (GRID_ROWS - 1);
    for (let col = 0; col < GRID_COLS; col++) {
      const longitude = LON_MIN + (col * (LON_MAX - LON_MIN)) / (GRID_COLS - 1);
      coords.push({ longitude, latitude });
    }
  }
  return coords;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/** Open-Meteo's wind direction is meteorological "from" convention — the vector points the other way. */
function windVector(speedMs: number, directionFromDeg: number): { u: number; v: number } {
  const rad = (directionFromDeg * Math.PI) / 180;
  return { u: -speedMs * Math.sin(rad), v: -speedMs * Math.cos(rad) };
}

/** Open-Meteo's ocean current direction is oceanographic "towards" convention — the vector points that way directly. */
function currentVector(speedMs: number, directionToDeg: number): { u: number; v: number } {
  const rad = (directionToDeg * Math.PI) / 180;
  return { u: speedMs * Math.sin(rad), v: speedMs * Math.cos(rad) };
}

async function fetchWindChunk(coords: GridCoordinate[]): Promise<FlowGridPoint[]> {
  const url = new URL(WIND_API_URL);
  url.searchParams.set('latitude', coords.map((c) => c.latitude).join(','));
  url.searchParams.set('longitude', coords.map((c) => c.longitude).join(','));
  url.searchParams.set('current', 'wind_speed_10m,wind_direction_10m');
  url.searchParams.set('wind_speed_unit', 'ms');

  const response = await fetchWithRetry(url.toString());
  if (!response.ok) throw new Error(`Open-Meteo wind request failed (${response.status})`);
  const body = await response.json();
  const entries: any[] = Array.isArray(body) ? body : [body];

  return coords.map((coord, i) => {
    const speed = entries[i]?.current?.wind_speed_10m;
    const direction = entries[i]?.current?.wind_direction_10m;
    if (speed == null || direction == null) {
      return { longitude: coord.longitude, latitude: coord.latitude, u: null, v: null };
    }
    return { longitude: coord.longitude, latitude: coord.latitude, ...windVector(speed, direction) };
  });
}

async function fetchCurrentChunk(coords: GridCoordinate[]): Promise<FlowGridPoint[]> {
  const url = new URL(MARINE_API_URL);
  url.searchParams.set('latitude', coords.map((c) => c.latitude).join(','));
  url.searchParams.set('longitude', coords.map((c) => c.longitude).join(','));
  url.searchParams.set('current', 'ocean_current_velocity,ocean_current_direction');

  const response = await fetchWithRetry(url.toString());
  if (!response.ok) throw new Error(`Open-Meteo marine request failed (${response.status})`);
  const body = await response.json();
  const entries: any[] = Array.isArray(body) ? body : [body];

  return coords.map((coord, i) => {
    // Land cells come back null here — left as null so the particle sim can
    // treat them as no-data (see oceanFlowParticles.ts) instead of erroring.
    const speedKmh = entries[i]?.current?.ocean_current_velocity;
    const direction = entries[i]?.current?.ocean_current_direction;
    if (speedKmh == null || direction == null) {
      return { longitude: coord.longitude, latitude: coord.latitude, u: null, v: null };
    }
    return { longitude: coord.longitude, latitude: coord.latitude, ...currentVector(speedKmh / 3.6, direction) };
  });
}

/**
 * Fetches the world wind + current grids once. All chunk requests (wind and
 * current interleaved) are staggered rather than fired in one burst — see
 * `runStaggered`'s doc comment for why.
 */
export async function fetchOceanFlowGrids(): Promise<OceanFlowGrids> {
  const coords = buildGridCoordinates();
  const coordChunks = chunk(coords, CHUNK_SIZE);

  // Interleaved so wind and current chunks share the same stagger schedule
  // instead of each dataset bursting on its own.
  const windTasks = coordChunks.map((c) => () => fetchWindChunk(c));
  const currentTasks = coordChunks.map((c) => () => fetchCurrentChunk(c));
  const interleaved: Array<() => Promise<FlowGridPoint[]>> = [];
  for (let i = 0; i < coordChunks.length; i++) {
    interleaved.push(windTasks[i], currentTasks[i]);
  }
  const results = await Promise.all(runStaggered(interleaved));
  const windChunks = results.filter((_, i) => i % 2 === 0);
  const currentChunks = results.filter((_, i) => i % 2 === 1);

  const gridBase = {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    lonMin: LON_MIN,
    lonMax: LON_MAX,
    latMin: LAT_MIN,
    latMax: LAT_MAX,
  };

  const wind: FlowGrid = { ...gridBase, points: windChunks.flat() };
  const current: FlowGrid = { ...gridBase, points: currentChunks.flat() };
  return { wind, current };
}
