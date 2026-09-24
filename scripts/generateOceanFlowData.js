// Run this ONCE, offline, before each deploy:
//   node scripts/generateOceanFlowData.js
//
// Fetches a world grid of wind (Open-Meteo Forecast API) and ocean-current
// (Open-Meteo Marine API) vectors and writes public/ocean-flow-data.json.
// The browser never calls Open-Meteo itself — src/features/maritime-map/api/
// oceanFlowApi.ts just fetches this static, same-origin file at runtime.
//
// Grid shape/conversions mirror oceanFlowApi.ts exactly so the output matches
// the app's OceanFlowGrids/FlowGrid types (see types/oceanFlowTypes.ts).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GRID_COLS = 24;
const GRID_ROWS = 14;
// Stops short of the poles: lon/lat -> meters conversion blows up as cos(lat) -> 0,
// and there's no wind/current data there anyway.
const LAT_MIN = -60;
const LAT_MAX = 75;
const LON_MIN = -180;
const LON_MAX = 180;

const WIND_API_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';

// Open-Meteo accepts many comma-separated locations per request; stay well under its ~100 limit.
const CHUNK_SIZE = 90;
const REQUEST_STAGGER_MS = 220;
const MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 1200;

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'ocean-flow-data.json');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGridCoordinates() {
  const coords = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const latitude = LAT_MIN + (row * (LAT_MAX - LAT_MIN)) / (GRID_ROWS - 1);
    for (let col = 0; col < GRID_COLS; col++) {
      const longitude = LON_MIN + (col * (LON_MAX - LON_MIN)) / (GRID_COLS - 1);
      coords.push({ longitude, latitude });
    }
  }
  return coords;
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/** Retries a 429 with backoff (honoring Retry-After when the server sends one); any other non-OK status fails immediately. */
async function fetchWithRetry(url) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response;
    if (response.status !== 429 || attempt === MAX_RETRIES) return response;

    const retryAfterHeader = Number(response.headers.get('retry-after'));
    const delayMs =
      Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : RETRY_BASE_DELAY_MS * 2 ** attempt;
    console.warn(`  429 from ${new URL(url).host} — retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
    await sleep(delayMs);
  }
  return fetch(url);
}

function runStaggered(tasks) {
  return tasks.map((task, i) => sleep(i * REQUEST_STAGGER_MS).then(task));
}

// Open-Meteo's wind direction is meteorological "from" convention — the vector points the other way.
function windVector(speedMs, directionFromDeg) {
  const rad = (directionFromDeg * Math.PI) / 180;
  return { u: -speedMs * Math.sin(rad), v: -speedMs * Math.cos(rad) };
}

// Open-Meteo's ocean current direction is oceanographic "towards" convention — the vector points that way directly.
function currentVector(speedMs, directionToDeg) {
  const rad = (directionToDeg * Math.PI) / 180;
  return { u: speedMs * Math.sin(rad), v: speedMs * Math.cos(rad) };
}

async function fetchWindChunk(coords) {
  const url = new URL(WIND_API_URL);
  url.searchParams.set('latitude', coords.map((c) => c.latitude).join(','));
  url.searchParams.set('longitude', coords.map((c) => c.longitude).join(','));
  url.searchParams.set('current', 'wind_speed_10m,wind_direction_10m');
  url.searchParams.set('wind_speed_unit', 'ms');

  const response = await fetchWithRetry(url.toString());
  if (!response.ok) throw new Error(`Open-Meteo wind request failed (${response.status})`);
  const body = await response.json();
  const entries = Array.isArray(body) ? body : [body];

  return coords.map((coord, i) => {
    const speed = entries[i]?.current?.wind_speed_10m;
    const direction = entries[i]?.current?.wind_direction_10m;
    if (speed == null || direction == null) {
      return { longitude: coord.longitude, latitude: coord.latitude, u: null, v: null };
    }
    return { longitude: coord.longitude, latitude: coord.latitude, ...windVector(speed, direction) };
  });
}

async function fetchCurrentChunk(coords) {
  const url = new URL(MARINE_API_URL);
  url.searchParams.set('latitude', coords.map((c) => c.latitude).join(','));
  url.searchParams.set('longitude', coords.map((c) => c.longitude).join(','));
  url.searchParams.set('current', 'ocean_current_velocity,ocean_current_direction');

  const response = await fetchWithRetry(url.toString());
  if (!response.ok) throw new Error(`Open-Meteo marine request failed (${response.status})`);
  const body = await response.json();
  const entries = Array.isArray(body) ? body : [body];

  return coords.map((coord, i) => {
    // Land cells come back null here — left as null so the particle sim can
    // treat them as no-data instead of erroring (see oceanFlowParticles.ts).
    const speedKmh = entries[i]?.current?.ocean_current_velocity;
    const direction = entries[i]?.current?.ocean_current_direction;
    if (speedKmh == null || direction == null) {
      return { longitude: coord.longitude, latitude: coord.latitude, u: null, v: null };
    }
    return { longitude: coord.longitude, latitude: coord.latitude, ...currentVector(speedKmh / 3.6, direction) };
  });
}

async function fetchInChunks(coordChunks, fetcher, label) {
  const results = [];
  const tasks = coordChunks.map((c) => () => fetcher(c));
  const staggered = runStaggered(tasks);
  for (let i = 0; i < staggered.length; i++) {
    results.push(...(await staggered[i]));
    console.log(`  ${label}: chunk ${i + 1}/${coordChunks.length} done`);
  }
  return results;
}

async function main() {
  const coords = buildGridCoordinates();
  const coordChunks = chunk(coords, CHUNK_SIZE);
  console.log(`Fetching ${coords.length} grid points (${coordChunks.length} chunks each) for wind + current...`);

  const [windPoints, currentPoints] = await Promise.all([
    fetchInChunks(coordChunks, fetchWindChunk, 'wind'),
    fetchInChunks(coordChunks, fetchCurrentChunk, 'current'),
  ]);

  const gridBase = {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    lonMin: LON_MIN,
    lonMax: LON_MAX,
    latMin: LAT_MIN,
    latMax: LAT_MAX,
  };

  const output = {
    generatedAt: new Date().toISOString(),
    wind: { ...gridBase, points: windPoints },
    current: { ...gridBase, points: currentPoints },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
  console.log('Done — wrote', OUTPUT_PATH);
}

main().catch((err) => {
  console.error('Failed to generate ocean flow data:', err);
  process.exit(1);
});
