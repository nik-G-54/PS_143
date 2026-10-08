// Coast guard station reference data for the drill-alert feature.
//
// A static file in `public/data/`, fetched from this app's own origin — not a
// backend call. Entries are validated here because the file is hand-edited:
// one malformed row must not take the others (or the map) down with it.

import type { CoastGuardStation } from '../types/alertTypes';

export const STATIONS_PATH = 'data/coast-guard-stations.json';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Keeps entries that have an id and in-range coordinates; drops the rest. */
export function parseStations(json: unknown): CoastGuardStation[] {
  if (!Array.isArray(json)) return [];

  const stations: CoastGuardStation[] = [];
  for (const item of json) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const id = asString(r.id).trim();
    if (!id || !isFiniteNumber(r.lat) || !isFiniteNumber(r.lon)) continue;
    if (Math.abs(r.lat) > 90 || Math.abs(r.lon) > 180) continue;
    const station: CoastGuardStation = {
      id,
      name: asString(r.name),
      organisation: asString(r.organisation),
      country: asString(r.country),
      lat: r.lat,
      lon: r.lon,
      source_url: asString(r.source_url),
    };
    if (asString(r.name_local)) station.name_local = asString(r.name_local);
    // Provenance of the coordinates; optional so older/hand-made entries still load.
    if (r.coordinate_source === 'official' || r.coordinate_source === 'openstreetmap') {
      station.coordinate_source = r.coordinate_source;
    }
    if (asString(r.coordinate_source_url)) station.coordinate_source_url = asString(r.coordinate_source_url);
    if (asString(r.coordinate_note)) station.coordinate_note = asString(r.coordinate_note);
    stations.push(station);
  }
  return stations;
}

export async function loadStations(signal?: AbortSignal): Promise<CoastGuardStation[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}${STATIONS_PATH}`, { signal });
  if (!response.ok) throw new Error(`Station list request failed (${response.status})`);
  return parseStations(await response.json());
}
