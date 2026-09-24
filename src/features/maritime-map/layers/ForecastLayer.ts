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
  waypointScatterRadiusMeters,
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

/**
 * Convert a ground distance (meters) at `latitude` into a [dLon, dLat]
 * offset in degrees along `bearingDeg`. Zoom-independent — unlike a
 * pixel-based offset, the same call returns the same real-world offset at
 * any zoom, so callers whose spread should hold a constant ground footprint
 * (the scatter cloud below, mirroring `heatmapRadiusPixelsForZoom`'s fixed
 * `HEATMAP_RADIUS_METERS` footprint) don't need to rebuild their geometry on
 * every zoom change.
 */
function metersOffsetToDegrees(latitude: number, lengthM: number, bearingDeg: number): [number, number] {
  const bearingRad = bearingDeg * RAD_PER_DEG;
  const dLat = (lengthM * Math.cos(bearingRad)) / METERS_PER_DEGREE_LAT;
  const dLon =
    (lengthM * Math.sin(bearingRad)) / (METERS_PER_DEGREE_LON_AT_EQUATOR * Math.max(0.01, Math.cos(latitude * RAD_PER_DEG)));
  return [dLon, dLat];
}

/** Scatter dots drawn around each forecast waypoint. */
const SCATTER_DOTS_PER_WAYPOINT = 200;
/**
 * Half-angle of the forward-biased scatter cone around the drift heading,
 * degrees. Wide enough — combined with the triangular (not uniform) angle
 * distribution below — that the cloud reads as a fuzzy directional drift, not
 * a confirmed single-line path.
 */
const SCATTER_CONE_HALF_ANGLE_DEG = 55;

/** Deterministic, fast PRNG so the scatter cloud doesn't reshuffle on every re-render. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable per-waypoint seed from the forecast id and point index, so the cloud is reproducible across re-renders of the same forecast. */
function scatterSeed(spillId: string, index: number): number {
  let hash = 2166136261 ^ index;
  for (let i = 0; i < spillId.length; i += 1) {
    hash = Math.imul(hash ^ spillId.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

interface ScatterDot {
  longitude: number;
  latitude: number;
  color: [number, number, number, number];
  radiusPx: number;
}

/**
 * Forecast waypoints — instead of a single rotated arrow at each point, a
 * cloud of `SCATTER_DOTS_PER_WAYPOINT` dots scattered around it, biased
 * toward its own `driftHeadingDeg` (see `forecastEncoding.ts`'s header note
 * on this layer: a sluggish stretch of drift reads as lower-confidence right
 * where it happens, rather than the whole path sharing one forecast-wide
 * confidence level). The dots thin out and fade with distance from the
 * point, so each cloud reads as "oil drifting this way, roughly" rather than
 * a single confirmed line — deliberately fuzzier than the old chevron, since
 * a forecast heading is an estimate, not a certainty.
 *
 * `driftHeadingDeg` is degrees clockwise from north (see
 * `EnvironmentLayer.ts`'s matching note on the backend's wind/current
 * vectors). Null headings (backend didn't report one for that sample) fall
 * back to pointing along the path's own bearing to the next point, so a
 * cloud is never left arbitrarily centered on north.
 */
function buildScatterCloud(forecast: SpillForecast): ScatterDot[] {
  const points = forecast.points;

  const fallbackBearingDeg = (index: number): number => {
    const a = points[index];
    const b = points[index + 1] ?? points[index - 1];
    if (!b || a === b) return 0;
    const dLon = b.longitude - a.longitude;
    const dLat = b.latitude - a.latitude;
    return Math.atan2(dLon, dLat) * DEG_PER_RAD;
  };

  const dots: ScatterDot[] = [];

  points.forEach((d, index) => {
    const headingDeg = d.driftHeadingDeg ?? fallbackBearingDeg(index);
    const [r, g, b] = forecastColorAt(forecastProgress(d));
    const baseOpacity = waypointOpacity(d.driftSpeedKnots);
    const maxReachM = waypointScatterRadiusMeters(d.driftSpeedKnots);
    const rand = mulberry32(scatterSeed(forecast.spillId, index));

    for (let i = 0; i < SCATTER_DOTS_PER_WAYPOINT; i += 1) {
      // Triangular distribution (sum of two uniforms) concentrates dots near
      // the heading line while still letting some drift wide of it.
      const angleDeg = headingDeg + (rand() + rand() - 1) * SCATTER_CONE_HALF_ANGLE_DEG;
      // sqrt bias spreads dots evenly by area rather than piling them up at
      // the center point.
      const t = Math.sqrt(rand());
      const distanceM = maxReachM * t;
      const [dLon, dLat] = metersOffsetToDegrees(d.latitude, distanceM, angleDeg);

      dots.push({
        longitude: d.longitude + dLon,
        latitude: d.latitude + dLat,
        color: [r, g, b, Math.round(baseOpacity * (1 - t) * (0.5 + 0.5 * rand()))],
        radiusPx: 1 + rand() * 1.5,
      });
    }
  });

  return dots;
}

function createWaypointsLayer(forecast: SpillForecast): ScatterplotLayer<ScatterDot> {
  const pathKey = `${forecast.spillId}:${forecast.points.length}:${forecast.points[forecast.points.length - 1]?.timestampMs ?? 0}`;

  return new ScatterplotLayer<ScatterDot>({
    id: LAYER_IDS.forecastWaypoints,
    data: buildScatterCloud(forecast),
    getPosition: (d) => [d.longitude, d.latitude],
    getFillColor: (d) => d.color,
    getRadius: (d) => d.radiusPx,
    radiusUnits: 'pixels',
    radiusMinPixels: 1,
    radiusMaxPixels: 3,
    stroked: false,
    filled: true,
    pickable: false,
    updateTriggers: {
      getPosition: [pathKey],
      getFillColor: [pathKey],
      getRadius: [pathKey],
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
 * ambient extent cue, then the path casing and path, then the per-waypoint
 * scatter clouds on top.
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
  layers.push(createWaypointsLayer(forecast));

  return layers;
}
