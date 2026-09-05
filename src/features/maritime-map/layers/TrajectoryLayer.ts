import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { SpillTrajectory, TrajectoryPoint } from '../types/trajectoryTypes';
import { LAYER_IDS } from './layerIds';
import {
  CASING_EXTRA_PX,
  DRIFT_CASING_RGBA,
  DRIFT_NEW_RGB,
  DRIFT_OLD_RGB,
  ORIGIN_RADIUS_PX,
  TICK_RADIUS_PX,
  UNCERTAINTY_FILL_ALPHA,
  UNCERTAINTY_STROKE_ALPHA,
  driftColorAt,
  driftProgress,
  driftWidthAt,
  selectTimeTicks,
} from './trajectoryEncoding';

export interface TrajectoryLayerOptions {
  /** Drift path for the spill under investigation, or null when there is none. */
  trajectory: SpillTrajectory | null;
  /**
   * When the timeline is active, draw only this clipped point list (oldest → playhead).
   * Pass null/undefined to draw the full trajectory.
   */
  visiblePoints?: SpillTrajectory['points'] | null;
  /** Oil head at the playhead — drawn when backtrack timeline is active. */
  oilPlayhead?: { longitude: number; latitude: number } | null;
}

/** Everything the origin marker's tooltip needs, so it never reaches back into the trajectory. */
interface DriftOriginDatum {
  longitude: number;
  latitude: number;
  radiusKm: number | null;
  /** Oldest drift position — the far end of the backtrack window. */
  windowStartMs: number;
  durationHours: number;
  totalDistanceKm: number;
}

/**
 * The backend's origin estimate drawn to true geographic scale.
 *
 * `radiusUnits: 'meters'` with no pixel floor is deliberate: this circle is a real
 * uncertainty distance, so it must shrink with the scale bar. A minimum pixel size
 * would keep it visible while quietly overstating how well the origin is known.
 */
function createUncertaintyLayer(origin: DriftOriginDatum): ScatterplotLayer<DriftOriginDatum> {
  return new ScatterplotLayer<DriftOriginDatum>({
    id: LAYER_IDS.driftOriginUncertainty,
    data: [origin],
    getPosition: (d) => [d.longitude, d.latitude],
    getRadius: (d) => (d.radiusKm ?? 0) * 1000,
    radiusUnits: 'meters',
    filled: true,
    stroked: true,
    getFillColor: [...DRIFT_NEW_RGB, UNCERTAINTY_FILL_ALPHA],
    getLineColor: [...DRIFT_NEW_RGB, UNCERTAINTY_STROKE_ALPHA],
    lineWidthUnits: 'pixels',
    getLineWidth: 1.25,
    pickable: false,
  });
}

/**
 * One polyline drawn twice: a dark casing, then the time-coloured path on top.
 *
 * `data` is the trajectory object itself so the per-vertex colour and width arrays
 * stay derived from it rather than being assembled into a hand-rolled datum.
 */
function createPathLayers(
  trajectory: SpillTrajectory,
  visiblePoints: SpillTrajectory['points']
): PathLayer<SpillTrajectory>[] {
  const pathKey = `${trajectory.spillId}:${visiblePoints.length}:${visiblePoints[visiblePoints.length - 1]?.timestampMs ?? 0}`;

  const shared = {
    data: [trajectory],
    getPath: (_d: SpillTrajectory) =>
      visiblePoints.map((point) => [point.longitude, point.latitude] as [number, number]),
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
    new PathLayer<SpillTrajectory>({
      ...shared,
      id: LAYER_IDS.driftPathCasing,
      getColor: DRIFT_CASING_RGBA,
      getWidth: () =>
        visiblePoints.map(
          (point) => driftWidthAt(driftProgress(point, trajectory.durationHours)) + CASING_EXTRA_PX
        ),
    }),
    new PathLayer<SpillTrajectory>({
      ...shared,
      id: LAYER_IDS.driftPath,
      getColor: () =>
        visiblePoints.map((point) => driftColorAt(driftProgress(point, trajectory.durationHours))),
      getWidth: () =>
        visiblePoints.map((point) => driftWidthAt(driftProgress(point, trajectory.durationHours))),
    }),
  ];
}

/** Time marks along the path, coloured to match the path where they sit. */
function createTimeTickLayer(
  ticks: TrajectoryPoint[],
  durationHours: number,
  spillId: string
): ScatterplotLayer<TrajectoryPoint> {
  return new ScatterplotLayer<TrajectoryPoint>({
    id: LAYER_IDS.driftTimeTicks,
    data: ticks,
    getPosition: (d) => [d.longitude, d.latitude],
    getRadius: TICK_RADIUS_PX,
    radiusUnits: 'pixels',
    filled: true,
    stroked: true,
    getFillColor: (d) => driftColorAt(driftProgress(d, durationHours)),
    getLineColor: [...DRIFT_CASING_RGBA.slice(0, 3), 200] as [number, number, number, number],
    lineWidthUnits: 'pixels',
    getLineWidth: 1,
    pickable: true,
    // Ticks are small; give the cursor a little slack so they are hoverable.
    radiusMinPixels: TICK_RADIUS_PX,
    updateTriggers: {
      getFillColor: [spillId],
    },
  });
}

/** Marker at the estimated origin, in the path's oldest-end hue. */
function createOriginLayer(origin: DriftOriginDatum): ScatterplotLayer<DriftOriginDatum> {
  return new ScatterplotLayer<DriftOriginDatum>({
    id: LAYER_IDS.driftOrigin,
    data: [origin],
    getPosition: (d) => [d.longitude, d.latitude],
    getRadius: ORIGIN_RADIUS_PX,
    radiusUnits: 'pixels',
    radiusMinPixels: ORIGIN_RADIUS_PX,
    filled: true,
    stroked: true,
    getFillColor: [...DRIFT_OLD_RGB, 240],
    getLineColor: [255, 255, 255, 225],
    lineWidthUnits: 'pixels',
    getLineWidth: 1.5,
    pickable: true,
  });
}

function createPlayheadLayer(
  position: { longitude: number; latitude: number }
): ScatterplotLayer<{ longitude: number; latitude: number }> {
  return new ScatterplotLayer({
    id: LAYER_IDS.driftPlayhead,
    data: [position],
    getPosition: (d) => [d.longitude, d.latitude],
    getRadius: 7,
    radiusUnits: 'pixels',
    radiusMinPixels: 6,
    filled: true,
    stroked: true,
    getFillColor: [...DRIFT_NEW_RGB, 250],
    getLineColor: [255, 255, 255, 240],
    lineWidthUnits: 'pixels',
    getLineWidth: 2,
    pickable: false,
  });
}

/**
 * Layers for the backtracked drift path of the spill under investigation.
 *
 * Ordered bottom-to-top: the uncertainty circle sits under everything, then the
 * path casing and the path, then the point markers. The caller paints the spill
 * detections above all of it so the selected dot stays the anchor of its own path.
 */
export function createTrajectoryLayers(options: TrajectoryLayerOptions): Layer[] {
  const { trajectory, visiblePoints, oilPlayhead } = options;
  if (!trajectory || trajectory.points.length < 2) return [];

  const pointsForPath =
    visiblePoints && visiblePoints.length >= 2 ? visiblePoints : trajectory.points;

  const layers: Layer[] = [];

  const origin: DriftOriginDatum | null = trajectory.source
    ? {
        longitude: trajectory.source.longitude,
        latitude: trajectory.source.latitude,
        radiusKm: trajectory.source.radiusKm,
        windowStartMs: trajectory.points[0].timestampMs,
        durationHours: trajectory.durationHours,
        totalDistanceKm: trajectory.totalDistanceKm,
      }
    : null;

  if (origin && origin.radiusKm != null) layers.push(createUncertaintyLayer(origin));

  layers.push(...createPathLayers(trajectory, pointsForPath));

  const ticks = selectTimeTicks(trajectory.points).filter((tick) =>
    pointsForPath.some((p) => p.timestampMs >= tick.timestampMs)
  );
  if (ticks.length > 0) {
    layers.push(createTimeTickLayer(ticks, trajectory.durationHours, trajectory.spillId));
  }

  if (origin) layers.push(createOriginLayer(origin));

  if (oilPlayhead) layers.push(createPlayheadLayer(oilPlayhead));

  return layers;
}

export type { DriftOriginDatum };
