import type { MapSpill } from '../types/spillTypes';

/**
 * Visual encoding for detected oil spills, shared by the deck.gl layer and the
 * on-map legend so the two can never drift apart.
 *
 * Mark size is a *proportional-symbol* encoding of `area_km2`, not the spill's
 * true geographic footprint. The demo dataset spans 0.02–48.5 km² inside a box
 * roughly 8 km across, so drawing real footprints would let the largest slick
 * cover half the scene and the smallest vanish below one pixel. Radius is
 * therefore in screen pixels — legible at every zoom — with mark *area* kept
 * proportional to spill area via sqrt(). The true polygon is available from the
 * spill detail endpoint when a later phase needs geographic extent.
 */

/** Oil-slick orange-red. One hue for all spills: size and opacity carry the data. */
export const SPILL_RGB: [number, number, number] = [239, 88, 58];

/** Selection ring / highlight, matching the app's amber primary. */
export const SELECTION_RGB: [number, number, number] = [217, 119, 87];

export const MIN_RADIUS_PX = 5;
export const MAX_RADIUS_PX = 20;

/** Alpha range driven by detection confidence. */
export const MIN_CONFIDENCE_ALPHA = 110;
export const MAX_CONFIDENCE_ALPHA = 240;

/** Alpha for detections pushed to the background while a spill is under investigation. */
export const DIMMED_ALPHA = 48;

/** Alpha used when `confidence_score` is missing — visibly fainter than any real score. */
export const UNKNOWN_CONFIDENCE_ALPHA = 80;

/**
 * Largest sqrt(area) in the dataset, used to normalize radius.
 * Derived from the data rather than hard-coded so the scale adapts if the archive grows.
 */
export function createAreaScale(spills: MapSpill[]): number {
  let maxSqrtArea = 0;
  for (const spill of spills) {
    if (spill.areaKm2 == null || spill.areaKm2 <= 0) continue;
    const sqrtArea = Math.sqrt(spill.areaKm2);
    if (sqrtArea > maxSqrtArea) maxSqrtArea = sqrtArea;
  }
  return maxSqrtArea;
}

/** Screen radius in pixels for a spill, given the dataset's area scale. */
export function radiusForArea(areaKm2: number | null, maxSqrtArea: number): number {
  if (areaKm2 == null || areaKm2 <= 0 || maxSqrtArea <= 0) return MIN_RADIUS_PX;
  const normalized = Math.min(1, Math.sqrt(areaKm2) / maxSqrtArea);
  return MIN_RADIUS_PX + normalized * (MAX_RADIUS_PX - MIN_RADIUS_PX);
}

/** Fill alpha for a spill's detection confidence (0..1). */
export function alphaForConfidence(confidenceScore: number | null): number {
  if (confidenceScore == null) return UNKNOWN_CONFIDENCE_ALPHA;
  return Math.round(
    MIN_CONFIDENCE_ALPHA + confidenceScore * (MAX_CONFIDENCE_ALPHA - MIN_CONFIDENCE_ALPHA)
  );
}

function lerpRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Bright amber-orange sheen right at the patch's true boundary. */
const OIL_SHEEN_RGB: [number, number, number] = [238, 150, 58];
/** Deep rust-brown weathered crude at the patch's interior — dark, but still reads as oil, not a hole. */
const OIL_CORE_RGB: [number, number, number] = [132, 48, 22];

/**
 * On-map footprint relative to the source geometry. The detected polygon /
 * area-equivalent radius is the full SAR detection extent; drawn 1:1 with a
 * soft fringe on top it dominated the investigation view and covered the
 * path, badges and vessel around it. Every band (fill, fringe, isolines) is
 * scaled by this about the patch centre, so shape and proportions are kept —
 * only the drawn size shrinks. Set to 1 to draw the true detection extent.
 */
export const OIL_PATCH_DISPLAY_SCALE = 0.7;

/**
 * Thin darker outline on every fill band — with the bands spaced evenly
 * (below) these read as the topographic "contour" steps inside the slick,
 * the way thickness bands show in a processed SAR/optical slick image.
 */
export const OIL_CONTOUR_LINE: { rgb: [number, number, number]; alpha: number } = {
  rgb: [98, 34, 14],
  alpha: 34,
};

/**
 * Oil-patch gradient — a weathered dark core narrowing to a warm sheen right
 * at the true boundary, in place of one flat fill colour. Neither deck.gl's
 * `PolygonLayer` nor a MapLibre `fill` layer can paint a true per-fragment
 * radial gradient, so `oilPatchGeometry.ts` fakes one by scaling the same
 * ring inward at each `insetFraction` (a fraction of the patch's own
 * equivalent radius, so the banding scales with the patch's real size) and
 * painting the bands boundary-first, darkest-last — smallest/darkest on top.
 * Both the static authoritative polygon (`SpillLayer.ts`) and the MapLibre
 * "focus mode" traveling polygon (`DriftTrajectory.ts`) read from these same
 * stops so the two never look like two different features.
 *
 * A double-digit band count (rather than the 3-4 stops a typical UI gradient
 * gets away with) is deliberate: this is flat-colour bands standing in for a
 * true per-fragment gradient, and with only a handful of stops each band's
 * edge reads as a visible ring — a bullseye, not a smooth fade. More/smaller
 * steps push those transitions below what's easy to pick out from real
 * viewing distance/zoom, at negligible extra cost (they're just polygons).
 * Bands are spaced evenly and the colour ramp front-loads (`t ** 0.55`) so a
 * yellow-amber rim falls quickly into a warm rust-orange body; the faint
 * contour outlines (`OIL_CONTOUR_LINE`) add subtle thickness steps without
 * turning it into a bullseye.
 */
const OIL_PATCH_BAND_COUNT = 12;
export const OIL_PATCH_STOPS: { insetFraction: number; rgb: [number, number, number] }[] = Array.from(
  { length: OIL_PATCH_BAND_COUNT },
  (_, i) => {
    const t = i / (OIL_PATCH_BAND_COUNT - 1);
    return { insetFraction: 0.82 * t, rgb: lerpRgb(OIL_SHEEN_RGB, OIL_CORE_RGB, t ** 0.55) };
  }
);

/** Alpha shared by every fill band above — the gradient does the work, not per-band transparency. */
export const OIL_PATCH_FILL_ALPHA = 232;

/**
 * Edge fringe just outside the boundary: a thin bright-amber lip, then a
 * cool teal halo where sheen meets water — the characteristic edge of a slick
 * in processed imagery. Deliberately tight (≤ 9% of the radius): it outlines
 * the patch instead of inflating it. Widest/faintest first so narrower,
 * brighter rings paint on top.
 */
export const OIL_GLOW_STOPS: { outsetFraction: number; rgb: [number, number, number]; alpha: number }[] = [
  { outsetFraction: 0.085, rgb: [58, 120, 128], alpha: 24 },
  { outsetFraction: 0.045, rgb: [66, 168, 146], alpha: 74 },
  { outsetFraction: 0.014, rgb: [248, 184, 84], alpha: 196 },
];

/**
 * Mottling: small lighter/darker blotches inside the body — the pooled,
 * uneven thickness visible in real slick imagery. Positions are fractions of
 * the patch's own radius/angle so they travel and scale with the patch.
 */
export const OIL_SPECKLES: { angle: number; dist: number; size: number; rgb: [number, number, number]; alpha: number }[] = [
  { angle: 0.3, dist: 0.42, size: 0.07, rgb: [200, 96, 42], alpha: 120 },
  { angle: 1.4, dist: 0.28, size: 0.05, rgb: [200, 96, 42], alpha: 110 },
  { angle: 2.2, dist: 0.5, size: 0.06, rgb: [96, 32, 14], alpha: 90 },
  { angle: 3.1, dist: 0.18, size: 0.08, rgb: [188, 84, 36], alpha: 100 },
  { angle: 3.9, dist: 0.46, size: 0.045, rgb: [206, 104, 46], alpha: 120 },
  { angle: 4.7, dist: 0.34, size: 0.055, rgb: [96, 32, 14], alpha: 80 },
  { angle: 5.5, dist: 0.55, size: 0.04, rgb: [214, 116, 52], alpha: 120 },
  { angle: 0.9, dist: 0.62, size: 0.035, rgb: [214, 116, 52], alpha: 110 },
];

/**
 * Faint concentric isolines rippling out into the water around the slick —
 * outline only, no fill — fading with distance. They give the patch the
 * "contoured field" context of the reference imagery without adding any
 * filled area.
 */
export const OIL_ISOLINE_STOPS: { outsetFraction: number; rgb: [number, number, number]; alpha: number }[] = [
  { outsetFraction: 0.2, rgb: [128, 156, 176], alpha: 46 },
  { outsetFraction: 0.38, rgb: [128, 156, 176], alpha: 30 },
  { outsetFraction: 0.58, rgb: [128, 156, 176], alpha: 16 },
];

