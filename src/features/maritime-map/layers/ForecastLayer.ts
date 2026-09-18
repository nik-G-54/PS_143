import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
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

/**
 * Forecast waypoints, each sized and dimmed by its own `driftSpeedKnots` (see
 * `forecastEncoding.ts`'s header note on this layer) — a sluggish stretch of
 * drift reads as lower-confidence right where it happens, rather than the
 * whole path sharing one forecast-wide confidence level.
 */
function createWaypointsLayer(forecast: SpillForecast): ScatterplotLayer<ForecastPoint> {
  return new ScatterplotLayer<ForecastPoint>({
    id: LAYER_IDS.forecastWaypoints,
    data: forecast.points,
    getPosition: (d) => [d.longitude, d.latitude],
    getRadius: (d) => waypointRadiusPx(d.driftSpeedKnots),
    radiusUnits: 'pixels',
    // The smallest a marker can shrink to (the low-confidence radius), not a
    // per-point value — deck.gl applies this as a single scalar floor.
    radiusMinPixels: waypointRadiusPx(0),
    filled: true,
    stroked: true,
    getFillColor: (d) => {
      const [r, g, b] = forecastColorAt(forecastProgress(d));
      return [r, g, b, waypointOpacity(d.driftSpeedKnots)];
    },
    getLineColor: [255, 255, 255, 200],
    lineWidthUnits: 'pixels',
    getLineWidth: 1,
    pickable: true,
    updateTriggers: {
      getRadius: [forecast.spillId],
      getFillColor: [forecast.spillId],
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
function createHeatmapLayer(forecast: SpillForecast, zoom: number): HeatmapLayer<ForecastPoint> {
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
    // Boosted alongside the wider radius so the now-more-spread-out weight
    // still reaches full saturation at the path's core instead of washing out.
    intensity: 2.2,
    // Low, rather than the HeatmapLayer default: a high threshold snaps
    // low-density edges straight to fully transparent, which is what reads as
    // a hard cutoff. This lets the fade extend further into the low end.
    threshold: 0.01,
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
  const { forecast, zoom } = options;
  if (!forecast || forecast.points.length < 2) return [];

  const layers: Layer[] = [];

  layers.push(createHeatmapLayer(forecast, zoom));
  layers.push(...createPathLayers(forecast));
  layers.push(createWaypointsLayer(forecast));

  return layers;
}
