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

import {
  OIL_CONTOUR_LINE,
  OIL_GLOW_STOPS,
  OIL_ISOLINE_STOPS,
  OIL_PATCH_DISPLAY_SCALE,
  OIL_PATCH_FILL_ALPHA,
  OIL_PATCH_STOPS,
} from '../layers/spillEncoding';

export interface OilPatchBand {
  ring: number[][];
  rgb: [number, number, number];
  /** 0-255, matching this codebase's deck.gl RGBA convention. */
  alpha: number;
  /** 'fill' paints the ring's area; 'line' strokes its outline only (isolines). */
  kind: 'fill' | 'line';
  /** Optional outline drawn on top of a fill band (contour step). */
  line?: { rgb: [number, number, number]; alpha: number };
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

/** Keep every `step`-th vertex of a closed ring (re-closed), never dropping below 8 vertices. */
function decimateRing(ring: number[][], step: number): number[][] {
  const open = ring.slice(0, -1);
  if (open.length / step < 8) return ring;
  const kept = open.filter((_, i) => i % step === 0);
  kept.push([kept[0][0], kept[0][1]]);
  return kept;
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
  return OIL_PATCH_STOPS.map((stop, i) => ({
    ring: scaleRing(ring, centre, OIL_PATCH_DISPLAY_SCALE * (1 - stop.insetFraction)),
    rgb: stop.rgb,
    alpha: OIL_PATCH_FILL_ALPHA,
    kind: 'fill' as const,
    // The outermost band's edge is the patch boundary itself — the fringe
    // handles that; contour lines only on the inner steps.
    line: i === 0 ? undefined : OIL_CONTOUR_LINE,
  }));
}

/** Edge fringe bands, widest/faintest first — render in this order so the narrower, brighter ring near the boundary paints on top. */
export function buildOilPatchGlowBands(ring: number[][]): OilPatchBand[] {
  const centre = ringCentroid(ring);
  return OIL_GLOW_STOPS.map((stop) => ({
    ring: scaleRing(ring, centre, OIL_PATCH_DISPLAY_SCALE * (1 + stop.outsetFraction)),
    rgb: stop.rgb,
    alpha: stop.alpha,
    kind: 'fill' as const,
  }));
}

/**
 * Outline-only isolines rippling out around the patch. Each is a smoothed
 * copy of the boundary so the outer rings round off with distance instead of
 * repeating every ragged edge detail — the way contour lines relax away from
 * a feature.
 */
export function buildOilPatchIsolines(ring: number[][]): OilPatchBand[] {
  const centre = ringCentroid(ring);
  // Thin the vertex set first (every 4th + 2 per ring further out) so repeated
  // Chaikin passes relax the shape without multiplying the vertex count —
  // this runs every animation frame for the traveling polygon.
  return OIL_ISOLINE_STOPS.map((stop, i) => ({
    ring: smoothRing(
      decimateRing(scaleRing(ring, centre, OIL_PATCH_DISPLAY_SCALE * (1 + stop.outsetFraction)), 4 + 2 * i),
      2
    ),
    rgb: stop.rgb,
    alpha: stop.alpha,
    kind: 'line' as const,
  }));
}
