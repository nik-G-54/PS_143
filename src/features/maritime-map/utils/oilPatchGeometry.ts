// src/features/maritime-map/utils/oilPatchGeometry.ts
//
// Turns one polygon ring into the set of scaled rings that fake a radial
// gradient + soft outer glow — see `spillEncoding.ts`'s `OIL_PATCH_STOPS`/
// `OIL_GLOW_STOPS` for why bands-of-flat-colour is the chosen technique.
// Pure, dependency-free arithmetic only (no turf, no rendering): both the
// static authoritative polygon (`SpillLayer.ts`, deck.gl) and the traveling
// Focus Mode polygon (`DriftTrajectory.ts`, MapLibre, rebuilt on every
// animation-frame progress tick) turn the returned bands into their own
// layer idiom — see below for why this file deliberately avoids turf.

import { OIL_GLOW_STOPS, OIL_PATCH_FILL_ALPHA, OIL_PATCH_STOPS } from '../layers/spillEncoding';

export interface OilPatchBand {
  ring: number[][];
  rgb: [number, number, number];
  /** 0-255, matching this codebase's deck.gl RGBA convention. */
  alpha: number;
}

/**
 * Plain average of the ring's vertices — not a true area centroid, but close
 * enough for these patches (radially generated around a centre point in
 * `organicPolygon.ts`, or a small real detection footprint) and O(n) instead
 * of turf's more careful area-weighted version, which matters here because
 * `smoothRing`/the band builders below run on every animation-frame update
 * of the traveling Focus Mode polygon, not just once per selection.
 */
function ringCentroid(ring: number[][]): [number, number] {
  let sumLon = 0;
  let sumLat = 0;
  for (const [lon, lat] of ring) {
    sumLon += lon;
    sumLat += lat;
  }
  return [sumLon / ring.length, sumLat / ring.length];
}

/**
 * Scale every vertex toward (`factor` < 1) or away from (`factor` > 1) a
 * centre point. This is the fake for "buffer the ring inward/outward" that
 * `buildOilPatchFillBands`/`buildOilPatchGlowBands` need: real polygon
 * buffering (`turf.buffer`) is comparatively expensive (offset-curve math,
 * can split a concave shape into pieces) and here always runs against these
 * roughly star-convex, radially-built patches, where scaling from the same
 * centre they were generated around reproduces a concentric band almost
 * exactly — at a fraction of the cost, and with no risk of degenerating to
 * an empty/split result the way erosion can.
 */
function scaleRing(ring: number[][], centre: [number, number], factor: number): number[][] {
  const [cx, cy] = centre;
  return ring.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
}

/**
 * Chaikin corner-cutting: repeatedly replace each vertex pair with two points
 * 1/4 and 3/4 of the way along their segment, which rounds every sharp joint
 * into a curve. Two passes roughly quadruple the vertex count — cheap (a
 * couple of linear passes over the ring) and, unlike fitting a true spline,
 * safe to re-run on every animation frame for the traveling Focus Mode
 * polygon, not just once per selection.
 */
export function smoothRing(ring: number[][], iterations = 2): number[][] {
  if (ring.length < 5) return ring;

  let points = ring.slice(0, -1); // drop the closing duplicate; re-close once at the end
  for (let iter = 0; iter < iterations; iter += 1) {
    const next: number[][] = [];
    const n = points.length;
    for (let i = 0; i < n; i += 1) {
      const p0 = points[i];
      const p1 = points[(i + 1) % n];
      next.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25]);
      next.push([p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    points = next;
  }
  points.push([points[0][0], points[0][1]]);
  return points;
}

/** Fill bands, boundary-first (outermost/brightest) to core-last (innermost/darkest) — render in this order so the core paints on top. */
export function buildOilPatchFillBands(ring: number[][]): OilPatchBand[] {
  const centre = ringCentroid(ring);
  return OIL_PATCH_STOPS.map((stop) => ({
    ring: scaleRing(ring, centre, 1 - stop.insetFraction),
    rgb: stop.rgb,
    alpha: OIL_PATCH_FILL_ALPHA,
  }));
}

/** Glow bands, widest/faintest first — render in this order so the narrower, brighter ring near the boundary paints on top. */
export function buildOilPatchGlowBands(ring: number[][]): OilPatchBand[] {
  const centre = ringCentroid(ring);
  return OIL_GLOW_STOPS.map((stop) => ({
    ring: scaleRing(ring, centre, 1 + stop.outsetFraction),
    rgb: stop.rgb,
    alpha: stop.alpha,
  }));
}
