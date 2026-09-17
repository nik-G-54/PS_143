// src/features/maritime-map/utils/coastalAlert.ts
//
// Distance-to-coast and alert-severity math for a forward drift forecast. Pure
// functions only — no rendering, no React, no network. The coastline geometry
// type is derived from `loadCoastline`'s own return type rather than declared
// separately, so this file can never drift from what that loader actually hands
// out.

import * as turf from '@turf/turf';
import type { Feature, LineString } from 'geojson';
import type { loadCoastline } from '../config/coastlineConfig';

/** The parsed coastline GeoJSON `loadCoastline` resolves to, minus the `null` miss case. */
export type CoastlineGeoJSON = NonNullable<Awaited<ReturnType<typeof loadCoastline>>>;

export interface GeoPoint {
  longitude: number;
  latitude: number;
}

export type AlertSeverity = 'monitor' | 'critical' | 'watch' | 'advisory';

/** International definition: 1 knot = 1.852 km/h, exact. */
const KM_PER_KNOT_HOUR = 1.852;

/** Below this, drift is too slow to project a meaningful landfall ETA. */
const STATIONARY_SPEED_KNOTS = 0.05;

const CRITICAL_ETA_HOURS = 3;
const WATCH_ETA_HOURS = 8;

const isLineStringFeature = (
  feature: Feature
): feature is Feature<LineString> => feature.geometry?.type === 'LineString';

/**
 * Distance from a point to the nearest coastline segment, km.
 *
 * `turf.pointToLineDistance` only accepts a single `LineString`, but a
 * multi-feature coastline extract is a mix of `LineString` and
 * `MultiLineString` (see `coastline-mediterranean.geojson`). This flattens
 * every feature down to single-part lines first, then takes the minimum
 * distance across all of them — the coast nearest to the point, not the
 * average distance to every segment in the file.
 */
export function computeDistanceToCoast(point: GeoPoint, coastlineGeoJSON: CoastlineGeoJSON): number {
  const pt = turf.point([point.longitude, point.latitude]);
  const lines = turf.flatten(coastlineGeoJSON).features.filter(isLineStringFeature);

  let minKm = Infinity;
  for (const line of lines) {
    const distanceKm = turf.pointToLineDistance(pt, line, { units: 'kilometers' });
    if (distanceKm < minKm) minKm = distanceKm;
  }
  return minKm;
}

/**
 * Classify how urgently a coastal landfall should be flagged.
 *
 * Below `STATIONARY_SPEED_KNOTS` the drift has effectively stalled, so an ETA
 * derived from distance/speed would blow up toward infinity without meaning
 * anything — that case is routed to `'monitor'` before the division happens,
 * rather than relying on the resulting huge ETA to fall into `'advisory'`.
 */
export function computeAlertSeverity(distanceKm: number, speedKnots: number): AlertSeverity {
  if (speedKnots < STATIONARY_SPEED_KNOTS) return 'monitor';

  const speedKmh = speedKnots * KM_PER_KNOT_HOUR;
  const etaHours = distanceKm / speedKmh;

  if (etaHours <= CRITICAL_ETA_HOURS) return 'critical';
  if (etaHours <= WATCH_ETA_HOURS) return 'watch';
  return 'advisory';
}
