import type { ForecastPoint } from '../types/forecastTypes';
import { metersPerPixel } from '../utils/geo';

/**
 * Visual encoding for the forward drift forecast — kept in its own file,
 * independent of `trajectoryEncoding.ts` (the backtrack path's encoding), so
 * the two color scales, widths and thresholds can each be tuned without
 * touching the other.
 *
 * Where backtrack runs cool-to-warm toward the detection, forecast runs
 * red-to-green over a fixed near-term window: red at `hoursFromNow = 0` (now,
 * most certain) fading to green by `hoursFromNow = FORECAST_GRADIENT_HOURS`
 * (further out, least certain). Unlike backtrack's gradient — which spans the
 * trajectory's own total duration — this window is a fixed constant rather
 * than the forecast's own duration, so a 3-hour and a 24-hour forecast read
 * the same "how soon" cue at a glance instead of both stretching red→green
 * across their full (very different) lengths.
 */

/** Path colour at `hoursFromNow = 0` — now, most certain. */
export const FORECAST_NEAR_RGB: [number, number, number] = [220, 38, 38];
/** Path colour at `hoursFromNow >= FORECAST_GRADIENT_HOURS` — further out, least certain. */
export const FORECAST_FAR_RGB: [number, number, number] = [34, 197, 94];

export const FORECAST_NEAR_ALPHA = 255;
export const FORECAST_FAR_ALPHA = 170;

/** Casing stroke drawn under the path for contrast against any basemap. */
export const FORECAST_CASING_RGBA: [number, number, number, number] = [4, 14, 22, 165];

export const PATH_WIDTH_NEAR_PX = 4;
export const PATH_WIDTH_FAR_PX = 1.5;
export const CASING_EXTRA_PX = 2.6;

/** Width of the red→now to green→+6h gradient window. Referenced by the legend copy. */
export const FORECAST_GRADIENT_HOURS = 6;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Position along the fixed gradient window: 0 at now, 1 at/beyond `FORECAST_GRADIENT_HOURS`. */
export function forecastProgress(point: ForecastPoint): number {
  return clamp01(point.hoursFromNow / FORECAST_GRADIENT_HOURS);
}

/** Vertex colour for a position along the forecast path. */
export function forecastColorAt(progress: number): [number, number, number, number] {
  return [
    Math.round(lerp(FORECAST_NEAR_RGB[0], FORECAST_FAR_RGB[0], progress)),
    Math.round(lerp(FORECAST_NEAR_RGB[1], FORECAST_FAR_RGB[1], progress)),
    Math.round(lerp(FORECAST_NEAR_RGB[2], FORECAST_FAR_RGB[2], progress)),
    Math.round(lerp(FORECAST_NEAR_ALPHA, FORECAST_FAR_ALPHA, progress)),
  ];
}

/** Vertex width in pixels for a position along the forecast path. */
export function forecastWidthAt(progress: number): number {
  return lerp(PATH_WIDTH_NEAR_PX, PATH_WIDTH_FAR_PX, progress);
}

/** Spacing of the time marks along the forecast path, hours. */
export const FORECAST_TICK_INTERVAL_HOURS = 2;

/**
 * Positions to mark with a time tick: the sample nearest each whole
 * `FORECAST_TICK_INTERVAL_HOURS` from now. Mirrors `trajectoryEncoding.ts`'s
 * `selectTimeTicks`, but walking forward from the start instead of backward
 * from the detection — ticks are chosen by elapsed time rather than index, so
 * spacing stays meaningful even if the backend ever samples unevenly. The
 * endpoints are skipped: "now" and the predicted position get their own
 * labels, not a numbered tick.
 */
export function selectForecastTimeTicks(points: ForecastPoint[]): ForecastPoint[] {
  if (points.length < 3) return [];

  const horizonHours = points[points.length - 1].hoursFromNow;
  if (!(horizonHours > FORECAST_TICK_INTERVAL_HOURS)) return [];

  const chosen = new Map<number, ForecastPoint>();

  for (
    let targetHours = FORECAST_TICK_INTERVAL_HOURS;
    targetHours < horizonHours;
    targetHours += FORECAST_TICK_INTERVAL_HOURS
  ) {
    let bestIndex = -1;
    let bestDelta = Infinity;

    // Endpoints excluded: index 0 is "now", the last index is the predicted position.
    for (let index = 1; index < points.length - 1; index += 1) {
      const delta = Math.abs(points[index].hoursFromNow - targetHours);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIndex = index;
      }
    }

    if (bestIndex >= 0) chosen.set(bestIndex, points[bestIndex]);
  }

  return [...chosen.keys()].sort((a, b) => a - b).map((index) => chosen.get(index) as ForecastPoint);
}

/**
 * Weight contributed by one point to the heatmap's spread-blob.
 *
 * Near-term points (progress ~0) weigh in near 1 so the blob is densest close
 * to "now"; far-term points fade toward a small floor rather than 0 so the
 * furthest reach of the forecast still registers as a faint edge instead of
 * vanishing outright.
 */
export function heatmapWeightAt(progress: number): number {
  return Math.max(0.1, 1 - progress);
}

/**
 * `HeatmapLayer.radiusPixels` has no geographic-unit option (unlike
 * `PathLayer`/`ScatterplotLayer`'s `widthUnits`/`radiusUnits` — checked
 * against deck.gl 9.3.11's own type declarations, which list `radiusPixels`
 * as the only radius prop). deck.gl aggregates density purely in screen
 * space, so a fixed `radiusPixels` covers a shrinking patch of ground every
 * time the camera zooms in — the gaps between forecast points that motivated
 * the original radius/intensity/threshold tuning reappear at higher zoom,
 * because the same 90px kernel that safely overlapped its neighbours at the
 * zoom this was tuned against now covers far less real distance.
 *
 * This re-derives `radiusPixels` from a fixed ground radius instead, so the
 * kernel's footprint stays constant in meters as the camera zooms, not in
 * pixels. `HEATMAP_RADIUS_METERS` is chosen to reproduce the previously tuned
 * 90px at zoom ≈13.5 (`cameraController.ts`'s `DRIFT_MAX_ZOOM`, where
 * `frameDriftPath` settles for a short forecast) and ~35°N — the exact
 * conditions that tuning was validated against — then holds that same ground
 * radius at every other zoom instead of a constant pixel radius.
 */
const HEATMAP_RADIUS_METERS = 1000;

/** deck.gl clamps `HeatmapLayer.radiusPixels` to this range regardless; going outside it is a silent no-op. */
const MIN_HEATMAP_RADIUS_PIXELS = 20;
const MAX_HEATMAP_RADIUS_PIXELS = 100;

/** Heatmap kernel radius, screen pixels, that currently covers `HEATMAP_RADIUS_METERS` of ground at this latitude/zoom. */
export function heatmapRadiusPixelsForZoom(latitude: number, zoom: number): number {
  const metersPerPx = metersPerPixel(latitude, zoom);
  if (!(metersPerPx > 0)) return MAX_HEATMAP_RADIUS_PIXELS;

  const radiusPixels = HEATMAP_RADIUS_METERS / metersPerPx;
  return Math.min(MAX_HEATMAP_RADIUS_PIXELS, Math.max(MIN_HEATMAP_RADIUS_PIXELS, radiusPixels));
}

// --- Waypoint confidence encoding -------------------------------------------
//
// Driven by each point's own `driftSpeedKnots`, not `SpillForecast.averageSpeedKnots`
// (that is a single summary figure for the whole forecast — see `forecastTypes.ts`).
// A per-point reading lets one sluggish stretch of an otherwise-fast forecast dim
// on its own, instead of the whole path sharing one uniform confidence level.

const MIN_WAYPOINT_RADIUS_PX = 3;
const MAX_WAYPOINT_RADIUS_PX = 8;
const MIN_WAYPOINT_OPACITY = 40;
const MAX_WAYPOINT_OPACITY = 230;

/** Speed at/above which a waypoint renders at full size and opacity — a presentational ceiling, not a physical cap on drift speed. */
const FULL_CONFIDENCE_SPEED_KNOTS = 2;

/**
 * Below this, drift has effectively stalled: direction and ETA derived from
 * it are unreliable, so the marker is forced to its smallest/dimmest state as
 * an explicit low-confidence signal rather than left to the continuous scale
 * (which would already put it near the floor, but not label it as such).
 * Mirrors `coastalAlert.ts`'s `STATIONARY_SPEED_KNOTS`.
 */
export const LOW_CONFIDENCE_SPEED_KNOTS = 0.05;

function speedScale(speedKnots: number): number {
  return clamp01(speedKnots / FULL_CONFIDENCE_SPEED_KNOTS);
}

/** Waypoint marker radius in pixels, scaled by drift speed. Null (unknown speed) is treated as low-confidence. */
export function waypointRadiusPx(speedKnots: number | null): number {
  if (speedKnots == null || speedKnots < LOW_CONFIDENCE_SPEED_KNOTS) return MIN_WAYPOINT_RADIUS_PX;
  return lerp(MIN_WAYPOINT_RADIUS_PX, MAX_WAYPOINT_RADIUS_PX, speedScale(speedKnots));
}

/** Waypoint marker opacity (0-255), scaled by drift speed. Null (unknown speed) is treated as low-confidence. */
export function waypointOpacity(speedKnots: number | null): number {
  if (speedKnots == null || speedKnots < LOW_CONFIDENCE_SPEED_KNOTS) {
    return Math.round(MIN_WAYPOINT_OPACITY * 0.5);
  }
  return Math.round(lerp(MIN_WAYPOINT_OPACITY, MAX_WAYPOINT_OPACITY, speedScale(speedKnots)));
}
