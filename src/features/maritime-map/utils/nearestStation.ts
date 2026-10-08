import * as turf from '@turf/turf';
import type { CoastGuardStation, NearestStation } from '../types/alertTypes';

const isCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * The station closest to a point by great-circle distance, or null when the
 * point has no usable coordinates or no station has any. Stations with
 * non-finite coordinates are skipped rather than ranked at distance 0/NaN.
 * On an exact tie the earlier station in the list wins.
 */
export function findNearestStation(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  stations: readonly CoastGuardStation[]
): NearestStation | null {
  if (!isCoordinate(latitude) || !isCoordinate(longitude)) return null;

  let best: NearestStation | null = null;
  for (const station of stations) {
    if (!isCoordinate(station.lat) || !isCoordinate(station.lon)) continue;
    const distanceKm = turf.distance([longitude, latitude], [station.lon, station.lat], {
      units: 'kilometers',
    });
    if (best === null || distanceKm < best.distanceKm) best = { station, distanceKm };
  }
  return best;
}
