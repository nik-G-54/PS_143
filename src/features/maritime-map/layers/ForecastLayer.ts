import { PathLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { Layer } from '@deck.gl/core';
import type { ForecastPoint, SpillForecast } from '../types/forecastTypes';
import { LAYER_IDS } from './layerIds';
import {
  CASING_EXTRA_PX,
  FORECAST_CASING_RGBA,
  forecastColorAt,
  forecastProgress,
  forecastWidthAt,
  heatmapRadiusPixelsForZoom,
  heatmapWeightAt,
  waypointOpacity,
  waypointRadiusPx,
} from './forecastEncoding';
import { metersPerPixel } from '../utils/geo';

export interface ForecastLayerOptions {
  /** Forward drift forecast for the spill under investigation, or null when there is none. */
  forecast: SpillForecast | null;
  /**
   * Current map zoom. The heatmap kernel's `radiusPixels` has no geographic-unit
   * option (see `forecastEncoding.ts`'s `heatmapRadiusPixelsForZoom`), so this
   * is required to re-derive it on every zoom change and keep the kernel's
   * ground footprint constant instead of shrinking as the camera zooms in.
   */
  zoom: number;
  /**
   * True while the camera is actively panning/zooming/rotating (see
   * `MaritimeMap.tsx`'s `movestart`/`moveend` listeners). `HeatmapLayer` is a
   * screen-space aggregation layer — unlike the plain `PathLayer`/
   * `ScatterplotLayer` below it, deck.gl re-runs its full GPU aggregation pass
   * on every rendered frame the viewport changes, not just when its own props
   * change. That per-frame cost is what actually made zooming feel laggy the
   * moment a forecast was active (the `zoom`-prop split above only stopped
   * *other* layers from rebuilting on zoom — this layer's internal aggregation
   * runs regardless of that). Dropping it for the gesture's duration and
   * restoring it once the camera settles keeps the interaction itself smooth
   * without giving up the density blob at rest.
   */
  isInteracting?: boolean;
}

/**
 * One polyline drawn twice: a dark casing, then the red(now)→green(+6h) coloured
 * path on top. Mirrors `TrajectoryLayer.ts`'s `createPathLayers`.
 *
 * `data` is the forecast object itself so the per-vertex colour and width
 * arrays stay derived from it rather than being assembled into a hand-rolled
 * datum.
 */
function createPathLayers(forecast: SpillForecast): PathLayer<SpillForecast>[] {
  const points = forecast.points;
  const pathKey = `${forecast.spillId}:${points.length}:${points[points.length - 1]?.timestampMs ?? 0}`;

  const shared = {
    data: [forecast],
    getPath: (_d: SpillForecast) => points.map((point) => [point.longitude, point.latitude] as [number, number]),
    widthUnits: 'pixels' as const,
    widthMinPixels: 1,
    jointRounded: true,
    capRounded: true,
    pickable: false,
    updateTriggers: {
      getPath: [pathKey],
      getColor: [pathKey],
      getWidth: [pathKey],
    },
  };

  return [
    new PathLayer<SpillForecast>({
      ...shared,
      id: LAYER_IDS.forecastPathCasing,
      getColor: FORECAST_CASING_RGBA,
      getWidth: () =>
        points.map((point) => forecastWidthAt(forecastProgress(point)) + CASING_EXTRA_PX),
    }),
    new PathLayer<SpillForecast>({
      ...shared,
      id: LAYER_IDS.forecastPath,
      getColor: () => points.map((point) => forecastColorAt(forecastProgress(point))),
      getWidth: () => points.map((point) => forecastWidthAt(forecastProgress(point))),
    }),
  ];
}

const DEG_PER_RAD = 180 / Math.PI;
const RAD_PER_DEG = Math.PI / 180;
/** WGS84-ish approximations, matching `utils/geo.ts`'s private constants. */
const METERS_PER_DEGREE_LAT = 110_574;
const METERS_PER_DEGREE_LON_AT_EQUATOR = 111_320;

/** Chevron half-angle (from the heading line to each wing), degrees. */
const ARROW_WING_ANGLE_DEG = 28;
/** Wing length as a fraction of the tip length — shorter wings read as a sharper arrowhead. */
const ARROW_WING_LENGTH_SCALE = 0.62;

/**
 * Convert a desired on-screen length (pixels) at `latitude`/`zoom` into a
 * [dLon, dLat] offset in degrees — the geographic-space equivalent of a
 * constant-pixel size, the same trick `forecastEncoding.ts`'s
 * `heatmapRadiusPixelsForZoom` uses in reverse for the heatmap kernel.
 */
function pixelOffsetToDegrees(
  latitude: number,
  zoom: number,
  lengthPx: number,
  bearingDeg: number
): [number, number] {
  const lengthM = lengthPx * metersPerPixel(latitude, zoom);
  const bearingRad = bearingDeg * RAD_PER_DEG;
  const dLat = (lengthM * Math.cos(bearingRad)) / METERS_PER_DEGREE_LAT;
  const dLon =
    (lengthM * Math.sin(bearingRad)) / (METERS_PER_DEGREE_LON_AT_EQUATOR * Math.max(0.01, Math.cos(latitude * RAD_PER_DEG)));
  return [dLon, dLat];
}

/**
 * Forecast waypoints — a small rotated chevron at each point, sized and
 * dimmed by its own `driftSpeedKnots` (see `forecastEncoding.ts`'s header
 * note on this layer: a sluggish stretch of drift reads as lower-confidence
 * right where it happens, rather than the whole path sharing one
 * forecast-wide confidence level) and rotated to its own `driftHeadingDeg` —
 * so the path shows which way the oil is moving at each point, not just
 * where it is.
 *
 * Built from `PathLayer` geometry (a 3-point "wingL → tip → wingR" polyline
 * per point, computed in real lon/lat offsets) rather than an `IconLayer`
 * texture-based marker: this deck.gl/WebGL setup was verified — by pushing
 * an isolated `IconLayer` directly through the live overlay outside this
 * app's own layer stack — to never rasterize `IconLayer` icons at all (no
 * console error, no pixel output, regardless of atlas vs. auto-packed icon
 * mode), while every vector layer already in this codebase (`PathLayer`,
 * `ScatterplotLayer`, `LineLayer`) renders correctly. A vector chevron sidesteps
 * that gap entirely.
 *
 * `driftHeadingDeg` is degrees clockwise from north (see
 * `EnvironmentLayer.ts`'s matching note on the backend's wind/current
 * vectors). Null headings (backend didn't report one for that sample) fall
 * back to pointing along the path's own bearing to the next point, so a
 * marker is never left arbitrarily pointing north.
 */
function createWaypointsLayer(forecast: SpillForecast, zoom: number): PathLayer<ForecastPoint> {
  const points = forecast.points;

  const fallbackBearingDeg = (index: number): number => {
    const a = points[index];
    const b = points[index + 1] ?? points[index - 1];
    if (!b || a === b) return 0;
    const dLon = b.longitude - a.longitude;
    const dLat = b.latitude - a.latitude;
    return Math.atan2(dLon, dLat) * DEG_PER_RAD;
  };

  const buildChevron = (d: ForecastPoint, index: number): [number, number][] => {
    const headingDeg = d.driftHeadingDeg ?? fallbackBearingDeg(index);
    const tipLengthPx = waypointRadiusPx(d.driftSpeedKnots) * 2.2;
    const wingLengthPx = tipLengthPx * ARROW_WING_LENGTH_SCALE;

    const [tipDLon, tipDLat] = pixelOffsetToDegrees(d.latitude, zoom, tipLengthPx, headingDeg);
    const [leftDLon, leftDLat] = pixelOffsetToDegrees(
      d.latitude,
      zoom,
      wingLengthPx,
      headingDeg + 180 - ARROW_WING_ANGLE_DEG
    );
    const [rightDLon, rightDLat] = pixelOffsetToDegrees(
      d.latitude,
      zoom,
      wingLengthPx,
      headingDeg + 180 + ARROW_WING_ANGLE_DEG
    );

    return [
      [d.longitude + leftDLon, d.latitude + leftDLat],
      [d.longitude + tipDLon, d.latitude + tipDLat],
      [d.longitude + rightDLon, d.latitude + rightDLat],
    ];
  };

  return new PathLayer<ForecastPoint>({
    id: LAYER_IDS.forecastWaypoints,
    data: points,
    getPath: (d, { index }) => buildChevron(d, index),
    getColor: (d) => {
      const [r, g, b] = forecastColorAt(forecastProgress(d));
      return [r, g, b, waypointOpacity(d.driftSpeedKnots)];
    },
    getWidth: 2,
    widthUnits: 'pixels',
    widthMinPixels: 1.5,
    jointRounded: true,
    capRounded: true,
    pickable: true,
    updateTriggers: {
      getPath: [forecast.spillId, zoom],
      getColor: [forecast.spillId],
    },
  });
}

/**
 * Forecast points as a weighted intensity source for an organic spread-blob
 * visual — density concentrated near "now" and fading outward, rather than
 * the crisp polyline the path layers draw. `colorRange` encodes aggregated
 * density (cool/transparent → hot/opaque), a different channel from the
 * path's red→green time encoding.
 */
function createHeatmapLayer(forecast: SpillForecast, zoom: number, visible: boolean): HeatmapLayer<ForecastPoint> {
  const centroidLat = (forecast.bounds.minLat + forecast.bounds.maxLat) / 2;
  // Re-derived on every zoom change (via the `zoom` param) so kernels keep
  // overlapping — and gaps don't reopen — however far the camera zooms in.
  // See `forecastEncoding.ts`'s `heatmapRadiusPixelsForZoom` for why this
  // can't just be a fixed `radiusPixels` value.
  const radiusPixels = heatmapRadiusPixelsForZoom(centroidLat, zoom);

  return new HeatmapLayer<ForecastPoint>({
    id: LAYER_IDS.forecastHeatmap,
    data: forecast.points,
    getPosition: (d) => [d.longitude, d.latitude],
    getWeight: (d) => heatmapWeightAt(forecastProgress(d)),
    radiusPixels,
    // Toggled via `visible`, not by leaving the layer out of the array —
    // deck.gl skips an invisible layer's update/render work (including the
    // aggregation pass this whole thing exists to avoid mid-gesture) without
    // tearing down and rebuilding its GPU-side aggregation state the way
    // removing/re-adding the layer instance would.
    visible,
    // Default is 2048 — massive overkill for a forecast's few dozen points
    // spread over a small patch of map. Cuts the aggregation texture's
    // per-frame GPU cost with no visible loss of quality at this data density.
    weightsTextureSize: 512,
    // Left at the HeatmapLayer default (1): the wide-radius/low-threshold
    // pass this used to pair with (see `forecastEncoding.ts`'s
    // `HEATMAP_RADIUS_METERS`) is what turned this into one big diffuse blob
    // that obscured the actual spill extent instead of reading as a bounded
    // hazard zone. A tighter kernel needs no extra intensity boost to reach
    // saturation at the path's core.
    intensity: 1,
    // Raised back toward the HeatmapLayer default: a very low threshold is
    // what let the low-density fade extend far past the kernel radius,
    // reading as a soft glow with no real edge. This keeps the cutoff close
    // to where the kernel itself falls off, so the heatmap reads as a
    // bounded zone rather than a halo.
    threshold: 0.05,
    // Alpha ramps 0 → 255 across the stops (the previous range left every
    // stop fully opaque), so density fades smoothly into the basemap instead
    // of jumping straight to a solid, hard-edged pale ring at the threshold.
    colorRange: [
      [255, 255, 178, 0],
      [254, 204, 92, 60],
      [253, 141, 60, 120],
      [240, 59, 32, 190],
      [189, 0, 38, 255],
    ],
    pickable: false,
    // radiusPixels is a plain prop, not an accessor — deck.gl's ordinary prop
    // diffing already re-applies it on change; no updateTriggers entry needed.
    updateTriggers: {
      getWeight: [forecast.spillId],
    },
  });
}

/**
 * Layers for the forward drift forecast of the spill under investigation.
 *
 * Ordered bottom-to-top: the heatmap spread sits under everything as an
 * ambient extent cue, then the path casing and path, then the waypoint
 * markers on top so they stay clickable.
 */
export function createForecastLayers(options: ForecastLayerOptions): Layer[] {
  const { forecast, zoom, isInteracting } = options;
  if (!forecast || forecast.points.length < 2) return [];

  const layers: Layer[] = [];

  // Hidden (not omitted) mid-gesture — see `isInteracting`'s doc comment
  // above and `createHeatmapLayer`'s `visible` note. The path and waypoint
  // layers are plain PathLayer/ScatterplotLayer, cheap to re-project every
  // frame, so they stay on throughout.
  layers.push(createHeatmapLayer(forecast, zoom, !isInteracting));
  layers.push(...createPathLayers(forecast));
  layers.push(createWaypointsLayer(forecast, zoom));

  return layers;
}
