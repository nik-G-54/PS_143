// Where are our spills, and how far is each from the nearest coast guard station?
//
//   node scripts/analyze-spill-locations.mjs            # fetch from the backend (GET only), then analyse
//   node scripts/analyze-spill-locations.mjs --cached   # re-use scripts/out/spill-locations.json, no network
//
// Reads VITE_API_BASE_URL from .env via Vite's loadEnv (the value is never printed).
// Station verification uses the same maths as src/features/maritime-map/utils/nearestStation.ts:
// turf.distance([lon, lat], [station.lon, station.lat], kilometers), skipping stations with
// non-finite coordinates, earlier station wins on an exact tie.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as turf from '@turf/turf';
import { loadEnv } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = resolve(root, 'scripts/out/spill-locations.json');
const STATIONS_FILE = resolve(root, 'public/data/coast-guard-stations.json');
const PAGE_SIZE = 100; // the backend caps this; it answers with the page_size it actually applied
const MAX_PAGES = 50;
const DELAY_MS = 400;
const FAR_KM = 150;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

async function fetchAll() {
  const env = loadEnv('development', root, 'VITE_');
  const base = (env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) throw new Error('VITE_API_BASE_URL is not set in .env');

  const items = [];
  let total = Infinity;
  for (let page = 1; page <= MAX_PAGES && items.length < total; page++) {
    const res = await fetch(`${base}/api/v1/demo/spills?page=${page}&page_size=${PAGE_SIZE}`, { method: 'GET' });
    if (!res.ok) throw new Error(`GET spills page ${page} failed: HTTP ${res.status}`);
    const body = await res.json();
    const got = body.items ?? [];
    if (Number.isFinite(body.total)) total = body.total;
    items.push(...got);
    console.log(`page ${page}: +${got.length} (${items.length}/${Number.isFinite(total) ? total : '?'})`);
    if (got.length === 0) break;
    await sleep(DELAY_MS);
  }
  return items;
}

function toLocation(item) {
  const c = item.centroid ?? {};
  const lat = c.lat ?? c.latitude;
  const lon = c.lon ?? c.longitude;
  return { spill_id: item.spill_id, lat, lon, detected_at: item.detected_at ?? null };
}

function nearestStation(lat, lon, stations) {
  if (!isNum(lat) || !isNum(lon)) return null;
  let best = null;
  for (const s of stations) {
    if (!isNum(s.lat) || !isNum(s.lon)) continue;
    const d = turf.distance([lon, lat], [s.lon, s.lat], { units: 'kilometers' });
    if (best === null || d < best.distanceKm) best = { station: s, distanceKm: d };
  }
  return best;
}

const median = (sorted) => (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);

async function main() {
  const cached = process.argv.includes('--cached');
  let locations;
  if (cached) {
    locations = JSON.parse(readFileSync(OUT_FILE, 'utf8'));
    console.log(`using cached ${locations.length} spills from scripts/out/spill-locations.json`);
  } else {
    const items = await fetchAll();
    locations = items.map(toLocation);
    mkdirSync(dirname(OUT_FILE), { recursive: true });
    writeFileSync(OUT_FILE, JSON.stringify(locations, null, 2));
    console.log(`saved ${locations.length} spills to scripts/out/spill-locations.json`);
  }

  const valid = locations.filter((l) => isNum(l.lat) && isNum(l.lon));
  console.log(`\n== Spills: ${locations.length} total, ${valid.length} with usable coordinates`);
  if (valid.length === 0) return;

  const lats = valid.map((l) => l.lat);
  const lons = valid.map((l) => l.lon);
  console.log(`bbox: lat ${Math.min(...lats).toFixed(4)} .. ${Math.max(...lats).toFixed(4)}, lon ${Math.min(...lons).toFixed(4)} .. ${Math.max(...lons).toFixed(4)}`);
  const dates = valid.map((l) => l.detected_at).filter(Boolean).sort();
  if (dates.length) console.log(`detected_at: ${dates[0]} .. ${dates[dates.length - 1]}`);

  const cells = new Map();
  for (const l of valid) {
    const key = `${Math.round(l.lat)}N,${Math.round(l.lon)}E`;
    const cell = cells.get(key) ?? { key, count: 0, sumLat: 0, sumLon: 0 };
    cell.count++;
    cell.sumLat += l.lat;
    cell.sumLon += l.lon;
    cells.set(key, cell);
  }
  console.log('\n== 1-degree grid cells (rounded), top 15');
  [...cells.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .forEach((c) => console.log(`${c.key.padEnd(10)} n=${String(c.count).padStart(4)}  mean ${(c.sumLat / c.count).toFixed(3)}, ${(c.sumLon / c.count).toFixed(3)}`));

  if (!existsSync(STATIONS_FILE)) return;
  const stations = JSON.parse(readFileSync(STATIONS_FILE, 'utf8'));
  console.log(`\n== Nearest station per spill (${stations.length} stations)`);
  const results = valid.map((l) => ({ ...l, near: nearestStation(l.lat, l.lon, stations) }));
  const dists = results.map((r) => r.near.distanceKm).sort((a, b) => a - b);
  console.log(`min ${dists[0].toFixed(1)} km, median ${median(dists).toFixed(1)} km, max ${dists[dists.length - 1].toFixed(1)} km`);

  const byStation = new Map();
  for (const r of results) byStation.set(r.near.station.id, (byStation.get(r.near.station.id) ?? 0) + 1);
  console.log('spills per nearest station:');
  [...byStation.entries()].sort((a, b) => b[1] - a[1]).forEach(([id, n]) => console.log(`  ${String(n).padStart(4)}  ${id}`));

  const far = results.filter((r) => r.near.distanceKm > FAR_KM);
  console.log(`\n== Spills with nearest station > ${FAR_KM} km: ${far.length}`);
  far.sort((a, b) => b.near.distanceKm - a.near.distanceKm).forEach((r) =>
    console.log(`  ${r.spill_id}  ${r.lat.toFixed(3)}, ${r.lon.toFixed(3)}  ${r.near.distanceKm.toFixed(1)} km -> ${r.near.station.id}`)
  );
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
