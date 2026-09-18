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

/** Warm amber-orange sheen right at the patch's true boundary. */
const OIL_SHEEN_RGB: [number, number, number] = [210, 98, 46];
/** Near-black weathered crude at the patch's deepest interior. */
const OIL_CORE_RGB: [number, number, number] = [24, 9, 8];

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
 * Bands cluster tightly near the boundary (the `t ** 1.3` ease below) so the
 * bright sheen reads as a thin rim over a large dark body, matching how a
 * real slick photographs, rather than spreading evenly to the core.
 */
const OIL_PATCH_BAND_COUNT = 10;
export const OIL_PATCH_STOPS: { insetFraction: number; rgb: [number, number, number] }[] = Array.from(
  { length: OIL_PATCH_BAND_COUNT },
  (_, i) => {
    const t = i / (OIL_PATCH_BAND_COUNT - 1);
    return { insetFraction: 0.82 * t ** 1.3, rgb: lerpRgb(OIL_SHEEN_RGB, OIL_CORE_RGB, t) };
  }
);

/** Alpha shared by every fill band above — the gradient does the work, not per-band transparency. */
export const OIL_PATCH_FILL_ALPHA = 235;

const OIL_GLOW_RGB: [number, number, number] = [214, 120, 58];

/**
 * Soft glow bled outward from the patch's true boundary into the surrounding
 * water, in place of a hard stroke — built the same way as the fill bands
 * above (see `oilPatchGeometry.ts`) but scaled *outward* with falling alpha.
 * Ordered widest/faintest first so it paints under the narrower, brighter
 * rings closer to the boundary. Kept fairly tight (maxes out under half the
 * patch's own radius) and low-alpha throughout — a glow that reaches too far
 * or too bright stops reading as a soft bloom and starts reading as another,
 * lighter-coloured ring of the patch itself.
 */
const OIL_GLOW_BAND_COUNT = 5;
export const OIL_GLOW_STOPS: { outsetFraction: number; rgb: [number, number, number]; alpha: number }[] =
  Array.from({ length: OIL_GLOW_BAND_COUNT }, (_, i) => {
    const t = i / (OIL_GLOW_BAND_COUNT - 1); // 0 = nearest the boundary, 1 = furthest out
    return {
      outsetFraction: 0.04 + 0.32 * t,
      rgb: OIL_GLOW_RGB,
      alpha: Math.round(58 * (1 - t) ** 1.6),
    };
  }).reverse();

