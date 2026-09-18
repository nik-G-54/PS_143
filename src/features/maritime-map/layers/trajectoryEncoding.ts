import type { TrajectoryPoint } from '../types/trajectoryTypes';

/**
 * Visual encoding for the backtracked oil drift path, shared by the deck.gl layers
 * and the on-map legend so the two can never drift apart.
 *
 * The path is drawn cool-to-warm against the detections rather than in the oil
 * palette: detections are orange-red, drift is cyan. Two channels carry the
 * direction of time along the path — colour brightens and the line thickens toward
 * the detection — so the polyline reads as "the oil came *from* there" without an
 * arrowhead. A dark casing underneath keeps it legible over pale vector water and
 * bright satellite imagery alike.
 *
 * Unlike the spill marks, the origin uncertainty circle is *not* a proportional
 * symbol: it is the backend's `radius_km` drawn to true geographic scale.
 */

/** Oldest end of the path — muted, recedes into the past. */
export const DRIFT_OLD_RGB: [number, number, number] = [56, 128, 163];

/** Newest end of the path — bright, meets the detection. */
export const DRIFT_NEW_RGB: [number, number, number] = [103, 232, 244];

export const DRIFT_OLD_ALPHA = 145;
export const DRIFT_NEW_ALPHA = 255;

/** Casing stroke drawn under the path for contrast against any basemap. */
export const DRIFT_CASING_RGBA: [number, number, number, number] = [4, 14, 22, 165];

export const PATH_WIDTH_OLD_PX = 1.5;
export const PATH_WIDTH_NEW_PX = 4;
export const CASING_EXTRA_PX = 2.6;

/** Spacing of the time marks along the path. Referenced by the legend copy. */
export const TICK_INTERVAL_HOURS = 4;
export const TICK_RADIUS_PX = 3;

export const ORIGIN_RADIUS_PX = 5.5;
export const UNCERTAINTY_FILL_ALPHA = 20;
export const UNCERTAINTY_STROKE_ALPHA = 100;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Position along the path as 0 (oldest) to 1 (the detection). */
export function driftProgress(point: TrajectoryPoint, durationHours: number): number {
  if (!(durationHours > 0)) return 1;
  return Math.min(1, Math.max(0, 1 - point.hoursBeforeDetection / durationHours));
}

/** Vertex colour for a position along the path. */
export function driftColorAt(progress: number): [number, number, number, number] {
  return [
    Math.round(lerp(DRIFT_OLD_RGB[0], DRIFT_NEW_RGB[0], progress)),
    Math.round(lerp(DRIFT_OLD_RGB[1], DRIFT_NEW_RGB[1], progress)),
    Math.round(lerp(DRIFT_OLD_RGB[2], DRIFT_NEW_RGB[2], progress)),
    Math.round(lerp(DRIFT_OLD_ALPHA, DRIFT_NEW_ALPHA, progress)),
  ];
}

/** Vertex width in pixels for a position along the path. */
export function driftWidthAt(progress: number): number {
  return lerp(PATH_WIDTH_OLD_PX, PATH_WIDTH_NEW_PX, progress);
}

/**
 * Positions to mark with a time tick: the sample nearest each whole
 * `TICK_INTERVAL_HOURS` before the detection.
 *
 * Ticks are chosen by elapsed time rather than by index so the spacing stays
 * meaningful even if the backend ever samples the drift unevenly. The endpoints are
 * skipped — the detection already has its own spill mark and the oldest position
 * sits under the origin marker.
 */
export function selectTimeTicks(points: TrajectoryPoint[]): TrajectoryPoint[] {
  if (points.length < 3) return [];

  const oldestHours = points[0].hoursBeforeDetection;
  if (!(oldestHours > TICK_INTERVAL_HOURS)) return [];

  const chosen = new Map<number, TrajectoryPoint>();

  for (
    let targetHours = TICK_INTERVAL_HOURS;
    targetHours < oldestHours;
    targetHours += TICK_INTERVAL_HOURS
  ) {
    let bestIndex = -1;
    let bestDelta = Infinity;

    // Endpoints excluded: index 0 is the origin end, the last index is the detection.
    for (let index = 1; index < points.length - 1; index += 1) {
      const delta = Math.abs(points[index].hoursBeforeDetection - targetHours);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIndex = index;
      }
    }

    if (bestIndex >= 0) chosen.set(bestIndex, points[bestIndex]);
  }

  return [...chosen.keys()].sort((a, b) => a - b).map((index) => chosen.get(index) as TrajectoryPoint);
}
