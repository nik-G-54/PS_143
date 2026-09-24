import type { TrajectoryPoint } from '../types/trajectoryTypes';

/**
 * Visual encoding for the backtracked oil drift path, shared by the deck.gl layers
 * and the on-map legend so the two can never drift apart.
 *
 * The path runs a "heat" gradient — green at the oldest/probable-source end,
 * through yellow-green, yellow and orange, to red at the detection — the
 * same green→red convention used for hazard/severity readouts elsewhere in
 * this app (see `coastalAlert.ts`), so the colour alone answers "how close
 * to the current detection was this point" without reading a single label.
 * Two channels carry the direction of time along the path — colour warms and
 * the line thickens toward the detection — so the polyline reads as "the oil
 * came *from* there" without needing an arrowhead. A dark casing underneath
 * keeps it legible over pale vector water and bright satellite imagery alike.
 *
 * Unlike the spill marks, the origin uncertainty circle is *not* a proportional
 * symbol: it is the backend's `radius_km` drawn to true geographic scale.
 */

const GRADIENT_SOURCE_RGB: [number, number, number] = [34, 197, 94]; // green
const GRADIENT_STOP_1_RGB: [number, number, number] = [163, 230, 53]; // yellow-green
const GRADIENT_STOP_2_RGB: [number, number, number] = [250, 204, 21]; // gold
const GRADIENT_STOP_3_RGB: [number, number, number] = [249, 115, 22]; // orange
const GRADIENT_DETECTION_RGB: [number, number, number] = [220, 38, 38]; // red

const DRIFT_GRADIENT_STOPS: [number, number, number][] = [
  GRADIENT_SOURCE_RGB,
  GRADIENT_STOP_1_RGB,
  GRADIENT_STOP_2_RGB,
  GRADIENT_STOP_3_RGB,
  GRADIENT_DETECTION_RGB,
];

/** Gradient endpoints, exported for markers that want one representative hue (origin marker, playhead, uncertainty circle). */
export const DRIFT_OLD_RGB = GRADIENT_SOURCE_RGB;
export const DRIFT_NEW_RGB = GRADIENT_DETECTION_RGB;

export const DRIFT_OLD_ALPHA = 210;
export const DRIFT_NEW_ALPHA = 255;

/** Casing stroke drawn under the path for contrast against any basemap. */
export const DRIFT_CASING_RGBA: [number, number, number, number] = [4, 14, 22, 165];

export const PATH_WIDTH_OLD_PX = 2;
export const PATH_WIDTH_NEW_PX = 4.5;
export const CASING_EXTRA_PX = 2.6;

/** Spacing of the time marks along the path. Referenced by the legend copy. */
export const TICK_INTERVAL_HOURS = 4;
export const TICK_RADIUS_PX = 3;

export const ORIGIN_RADIUS_PX = 5.5;
export const UNCERTAINTY_FILL_ALPHA = 20;
export const UNCERTAINTY_STROKE_ALPHA = 100;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Position along the path as 0 (oldest) to 1 (the detection). */
export function driftProgress(point: TrajectoryPoint, durationHours: number): number {
  if (!(durationHours > 0)) return 1;
  return clamp01(1 - point.hoursBeforeDetection / durationHours);
}

function sampleDriftGradient(progress: number): [number, number, number] {
  const clamped = clamp01(progress);
  const segments = DRIFT_GRADIENT_STOPS.length - 1;
  const scaled = clamped * segments;
  const index = Math.min(segments - 1, Math.floor(scaled));
  const localT = scaled - index;
  const from = DRIFT_GRADIENT_STOPS[index];
  const to = DRIFT_GRADIENT_STOPS[index + 1];
  return [
    Math.round(lerp(from[0], to[0], localT)),
    Math.round(lerp(from[1], to[1], localT)),
    Math.round(lerp(from[2], to[2], localT)),
  ];
}

/** Vertex colour for a position along the path. */
export function driftColorAt(progress: number): [number, number, number, number] {
  const [r, g, b] = sampleDriftGradient(progress);
  return [r, g, b, Math.round(lerp(DRIFT_OLD_ALPHA, DRIFT_NEW_ALPHA, progress))];
}

/**
 * CSS `rgb(...)` string for the same gradient sample — used by the HTML
 * marker badges (`timeTickMarkers.ts`), which style themselves with real CSS
 * rather than a deck.gl RGBA tuple. Kept as one function so the map's dots/
 * path and its marker badges can never read as two different gradients.
 */
export function driftColorCssAt(progress: number): string {
  const [r, g, b] = sampleDriftGradient(progress);
  return `rgb(${r}, ${g}, ${b})`;
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
