import type { GeoBounds } from '../types/spillTypes';

/** IUGG mean Earth radius, km. */
const EARTH_RADIUS_KM = 6371.0088;

/** Degrees of latitude per km. Close enough to constant for framing and readouts. */
const KM_PER_DEGREE_LAT = 110.574;

/** Degrees of longitude per km at the equator; scale by cos(latitude) elsewhere. */
const KM_PER_DEGREE_LON_AT_EQUATOR = 111.32;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two coordinates, km.
 *
 * This measures the length of a polyline the backend already produced — it does
 * not re-derive drift. Physics, attribution and correlation stay on the backend;
 * the frontend only describes the geometry it was handed.
 */
export function haversineKm(
  fromLon: number,
  fromLat: number,
  toLon: number,
  toLat: number
): number {
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLon / 2) ** 2;
  // Clamp before asin: rounding on antipodal-ish inputs can push the term past 1.
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Web Mercator ground resolution at zoom 0, meters/pixel at the equator (256px tiles). */
const WEB_MERCATOR_ZOOM0_RESOLUTION_M = 156543.03392;

/**
 * Ground distance one screen pixel covers at a given zoom/latitude, Web Mercator.
 *
 * Some deck.gl layers (e.g. `HeatmapLayer`) size themselves purely in screen
 * pixels with no geographic-unit option, so their footprint on the ground
 * shrinks every time the camera zooms in. This converts between the two, so a
 * caller can pick a fixed ground radius and re-derive the pixel value that
 * currently covers it.
 */
export function metersPerPixel(latitude: number, zoom: number): number {
  return (WEB_MERCATOR_ZOOM0_RESOLUTION_M * Math.cos(toRadians(latitude))) / Math.pow(2, zoom);
}

/**
 * Grow a bounding box outward by a distance in km.
 *
 * Used so a geographic circle of that radius — the backend's origin uncertainty —
 * is fully inside the box the camera frames, rather than relying on screen padding
 * that cannot know the circle's real size.
 */
export function expandBoundsByKm(bounds: GeoBounds, km: number): GeoBounds {
  if (!(km > 0)) return bounds;

  const midLat = (bounds.minLat + bounds.maxLat) / 2;
  // Guard the cos() term so a near-polar box cannot divide by ~0.
  const lonScale = Math.max(0.01, Math.cos(toRadians(midLat)));

  const dLat = km / KM_PER_DEGREE_LAT;
  const dLon = km / (KM_PER_DEGREE_LON_AT_EQUATOR * lonScale);

  return {
    minLon: bounds.minLon - dLon,
    minLat: bounds.minLat - dLat,
    maxLon: bounds.maxLon + dLon,
    maxLat: bounds.maxLat + dLat,
  };
}
