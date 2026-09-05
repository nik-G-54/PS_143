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
