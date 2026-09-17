// src/features/maritime-map/utils/trajectoryLineStyle.ts
//
// Pure, unit-testable style helpers for the raw drift trajectory LINE (Phase 1
// of the trajectory visual upgrade: smoothing, the time-direction colour
// gradient, and confidence-driven width/opacity scaling). Kept separate from
// `layers/TrajectoryLayer.ts` so the maths can be reasoned about — and
// tested — without touching deck.gl at all.
//
// Scope note: this module only concerns the backtracked drift PATH/LINE. It
// has no knowledge of, and must never import, the organic oil-slick polygon
// animation system (`organicPolygon.ts` / `oilSlickKeyframes.ts`) or the
// maplibre-native focus-polygon layer in
// `components/map/layers/DriftTrajectory.ts` — those are a separate,
// independently-animated feature that happens to live nearby in the tree.

import * as turf from '@turf/turf';

/** A minimal position — deliberately looser than `TrajectoryPoint` so these helpers stay reusable/testable. */
export interface LonLat {
  longitude: number;
  latitude: number;
}

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// ---------------------------------------------------------------------------
// 1. Path smoothing — turf.bezierSpline (do not hand-roll spline maths here)
// ---------------------------------------------------------------------------

/**
 * turf/bezier-spline's `resolution` option is the duration (ms) of an
 * internal, fictitious "animation" the spline is sampled from — it is NOT a
 * point count. Empirically (verified against the installed @turf/bezier-spline
 * against this repo's own trajectory shapes): output vertex count ≈
 * resolution / 20 + 1.
 *
 * 4000 was chosen to yield ~201 output vertices regardless of input size —
 * comfortably more than the largest trajectory exercised elsewhere in this
 * codebase (the 80-point case in `oilSlickKeyframes.test.ts`), so the smoothed
 * curve is never coarser than the raw drift samples it's built from, while
 * staying far short of the ~500 points the library's own 10000ms default
 * would generate for what is usually a short, few-dozen-point line.
 */
export const TRAJECTORY_BEZIER_RESOLUTION = 4000;

/**
 * turf/bezier-spline's `sharpness` option (0 = straight segments between the
 * raw points, 1 = maximum curvature — can overshoot past sharp turns). Left at
 * the library's own default of 0.85: verified against a worst-case zig-zag
 * (simulating a current/wind reversal) that even sharpness 1.0 only expands
 * the curve's bounding box a few percent past the raw points for that shape,
 * so 0.85 reads as a smooth, physically plausible drift path without implying
 * the oil looped somewhere it didn't.
 */
export const TRAJECTORY_BEZIER_SHARPNESS = 0.85;

/**
 * Smooth a raw drift path with `turf.bezierSpline`.
 *
 * Falls back to the raw (straight-segment) coordinates when there are fewer
 * than 2 points, or if turf ever throws on unexpected input — a jagged path
 * is a far better failure mode for map rendering than a blank one.
 *
 * turf.bezierSpline's own end conditions keep the first/last output
 * coordinates exactly equal to the first/last input coordinates (verified
 * empirically), so callers can treat `result[0]` / `result[result.length-1]`
 * as the true origin/detection positions — see `createTrajectoryEndpointLabels`
 * in `layers/TrajectoryLayer.ts`.
 */
export function buildSmoothedTrajectoryPath(points: LonLat[]): [number, number][] {
  const raw: [number, number][] = points.map((p) => [p.longitude, p.latitude]);
  if (raw.length < 2) return raw;

  try {
    const line = turf.lineString(raw);
    const curved = turf.bezierSpline(line, {
      resolution: TRAJECTORY_BEZIER_RESOLUTION,
      sharpness: TRAJECTORY_BEZIER_SHARPNESS,
    });
    const coords = curved.geometry.coordinates as [number, number][];
    return coords.length >= 2 ? coords : raw;
  } catch (error) {
    console.warn('[trajectoryLineStyle] bezierSpline failed, falling back to the raw path', error);
    return raw;
  }
}

// ---------------------------------------------------------------------------
// Shared: normalized position along a (possibly smoothed) path
// ---------------------------------------------------------------------------

/**
 * Each vertex's cumulative distance along `path`, normalized to 0 (first
 * vertex) .. 1 (last vertex). Uses `turf.distance` rather than plain vertex
 * index, because a bezier spline samples evenly over an internal parameter —
 * not evenly over arc length — so index-based fractions would misrepresent
 * "position along the path" wherever the curve bends.
 *
 * Trajectory points are oldest→newest (see `adapters/trajectoryAdapter.ts`),
 * so index 0 of `path` is always the ORIGIN end and the last index is the
 * DETECTION end: this returns 0 at origin, 1 at detection.
 */
export function computePathProgress(path: [number, number][]): number[] {
  if (path.length === 0) return [];
  if (path.length === 1) return [0];

  const cumulative: number[] = [0];
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += turf.distance(path[i - 1], path[i], { units: 'kilometers' });
    cumulative.push(total);
  }

  // Degenerate path (every vertex on top of the last) — fall back to even
  // spacing so callers still get a valid, strictly increasing 0..1 sequence
  // instead of dividing by zero.
  if (total === 0) {
    return path.map((_, i) => i / (path.length - 1));
  }
  return cumulative.map((d) => d / total);
}

// ---------------------------------------------------------------------------
// 2. Time-direction colour gradient
// ---------------------------------------------------------------------------

/**
 * DETECTION end: the same vivid red as the focus-mode oil-slick polygon's
 * fill (`components/map/layers/DriftTrajectory.ts`'s `FOCUS_FILL_ID`,
 * `#ff3b30`) — directly observed, so it gets the most saturated colour and
 * stays in the same established red hue family rather than introducing a
 * second "meaning" for red on this map.
 */
export const TRAJECTORY_DETECTION_RGBA: [number, number, number, number] = [255, 59, 48, 255];

/**
 * ORIGIN end: the SAME hue as the detection colour (~3° red in HSL),
 * desaturated from 100% -> 18% and darkened from 59% -> 42% lightness, with
 * alpha also lowered (255 -> 170). The result reads as a muted, receded
 * "red-gray" rather than a different hue or a pastel tint — this is the
 * backtracked, estimated end of the path, so it recedes in both saturation
 * and opacity.
 */
export const TRAJECTORY_ORIGIN_RGBA: [number, number, number, number] = [126, 90, 88, 170];

/**
 * Colour for a vertex at normalized position `t` along the trajectory line.
 *
 * Convention: t=0 is the DETECTION end, t=1 is the ORIGIN end (i.e. `t`
 * increases the same direction a backtrack runs: forward in the UI, backward
 * in time). Out-of-range input is clamped rather than extrapolated.
 */
export function interpolateTrajectoryColor(t: number): [number, number, number, number] {
  const clamped = clamp01(t);
  return [
    Math.round(lerp(TRAJECTORY_DETECTION_RGBA[0], TRAJECTORY_ORIGIN_RGBA[0], clamped)),
    Math.round(lerp(TRAJECTORY_DETECTION_RGBA[1], TRAJECTORY_ORIGIN_RGBA[1], clamped)),
    Math.round(lerp(TRAJECTORY_DETECTION_RGBA[2], TRAJECTORY_ORIGIN_RGBA[2], clamped)),
    Math.round(lerp(TRAJECTORY_DETECTION_RGBA[3], TRAJECTORY_ORIGIN_RGBA[3], clamped)),
  ];
}

// ---------------------------------------------------------------------------
// 3. Confidence-based stroke width / opacity (a channel separate from colour)
// ---------------------------------------------------------------------------

/** Per-vertex heuristic width (px), BEFORE the overall confidence scale below is applied. */
export const VERTEX_WIDTH_AT_DETECTION_PX = 5;
export const VERTEX_WIDTH_AT_ORIGIN_PX = 1.5;

/**
 * Per-vertex width heuristic — same `t` convention as `interpolateTrajectoryColor`
 * (0 = detection, 1 = origin).
 *
 * This is an explicit DESIGN HEURISTIC — thicker where the path is most
 * directly grounded (the observed detection) and thinner toward the
 * backtracked, estimated origin — NOT a rendering of real per-point backend
 * confidence data. `GET /api/v1/visualization/spills/{id}` returns one
 * `confidence_score` for the whole detection, never a per-position figure, so
 * nothing here should be read as more precise than that.
 */
export function vertexWidthAt(t: number): number {
  const clamped = clamp01(t);
  return lerp(VERTEX_WIDTH_AT_DETECTION_PX, VERTEX_WIDTH_AT_ORIGIN_PX, clamped);
}

const normalizeConfidence = (confidenceScore: number | null | undefined): number | null =>
  confidenceScore == null || !Number.isFinite(confidenceScore) ? null : clamp01(confidenceScore);

/**
 * Overall width multiplier for the whole path, driven by the spill's
 * `confidence_score` (0..1).
 *
 * Formula: 0.55 + 0.45 * confidence
 *   confidence 1.0  -> 1.000  (full width)
 *   confidence 0.9  -> 0.955
 *   confidence 0.7  -> 0.865
 *   confidence 0.5  -> 0.775
 *   confidence 0.0  -> 0.550  (floor — never zero/negative)
 *
 * A missing/non-finite score defaults to 1 (full scale), NOT the floor: the
 * absence of a number is not evidence the drift estimate is unreliable, so
 * this should not visually imply low confidence it has no basis for.
 */
export function confidenceToWidthScale(confidenceScore: number | null | undefined): number {
  const c = normalizeConfidence(confidenceScore);
  if (c == null) return 1;
  return 0.55 + 0.45 * c;
}

/**
 * Overall opacity multiplier for the whole path — same derivation as
 * `confidenceToWidthScale` but with a higher floor (0.6 vs 0.55), since a
 * near-invisible line is a harsher failure mode than a merely thin one.
 *
 *   confidence 1.0  -> 1.00
 *   confidence 0.9  -> 0.96
 *   confidence 0.7  -> 0.88
 *   confidence 0.5  -> 0.80
 *   confidence 0.0  -> 0.60  (floor)
 *   null/undefined  -> 1.00 (see confidenceToWidthScale)
 */
export function confidenceToOpacityScale(confidenceScore: number | null | undefined): number {
  const c = normalizeConfidence(confidenceScore);
  if (c == null) return 1;
  return 0.6 + 0.4 * c;
}

// ---------------------------------------------------------------------------
// 4. Origin / Detection endpoint labels
// ---------------------------------------------------------------------------

export const TRAJECTORY_ORIGIN_LABEL = 'ORIGIN';

/**
 * "DETECTED · T+16.4H"-style label text, one decimal place.
 *
 * Falls back to a bare "DETECTED" (no "T+...H" suffix) when
 * `estimatedAgeHours` is missing or not a finite number, rather than
 * rendering "T+undefinedH" or throwing — `estimated_age_hours` is only
 * populated once the spill detail fetch resolves (see `MapSpill` /
 * `adapters/spillAdapter.ts`) and can legitimately be null before then.
 */
export function formatDetectionLabel(estimatedAgeHours: number | null | undefined): string {
  if (estimatedAgeHours == null || !Number.isFinite(estimatedAgeHours)) return 'DETECTED';
  return `DETECTED · T+${estimatedAgeHours.toFixed(1)}H`;
}
