// src/components/map/layers/DriftTrajectory.ts
import type { Map, GeoJSONSource } from 'maplibre-gl';
import type { VisualizationData } from '../../../types/detail';

let animFrameId: number | null = null;

export function addDriftTrajectory(map: Map, viz: VisualizationData) {
  removeDriftTrajectory(map);

  if (!viz.trajectory || viz.trajectory.length === 0) return;

  const coords = viz.trajectory.map(t => [t.longitude, t.latitude]);
  const sourceId = 'drift-traj-source';
  const bgId = 'drift-traj-bg';
  const dashId = 'drift-traj-dash';

  map.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {},
    },
  });

  // Background line (solid, faint)
  map.addLayer({
    id: bgId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': '#38bdf8',
      'line-width': 3,
      'line-opacity': 0.25,
    },
  });

  // Animated dashed foreground
  map.addLayer({
    id: dashId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': '#38bdf8',
      'line-width': 3,
      'line-dasharray': [0, 4, 3],
    },
  });

  // Waypoint dots at every 5th trajectory point
  const waypointCoords = coords.filter((_, i) => i % 5 === 0 || i === coords.length - 1);
  map.addSource('drift-waypoints', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: waypointCoords.map(c => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: c },
        properties: {},
      })),
    },
  });

  map.addLayer({
    id: 'drift-waypoints-layer',
    type: 'circle',
    source: 'drift-waypoints',
    paint: {
      'circle-radius': 3,
      'circle-color': '#bae6fd',
      'circle-stroke-color': '#38bdf8',
      'circle-stroke-width': 1,
    },
  });

  // Marching ants animation
  const dashSequence = [
    [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
    [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
    [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5],
    [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
  ];

  let step = 0;
  function animate(timestamp: number) {
    const newStep = Math.floor((timestamp / 60) % dashSequence.length);
    if (newStep !== step) {
      if (map.getLayer(dashId)) {
        map.setPaintProperty(dashId, 'line-dasharray', dashSequence[newStep]);
      }
      step = newStep;
    }
    animFrameId = requestAnimationFrame(animate);
  }
  animFrameId = requestAnimationFrame(animate);
}

export function removeDriftTrajectory(map: Map) {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = null;

  ['drift-traj-dash', 'drift-traj-bg', 'drift-waypoints-layer'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  ['drift-traj-source', 'drift-waypoints'].forEach(id => {
    if (map.getSource(id)) map.removeSource(id);
  });
}

// --- Focus Mode: organic, morphing spill polygon -------------------------
//
// Renders the current interpolated polygon resolved by
// `resolvePolygonAtProgress` (features/maritime-map/utils/oilSlickKeyframes.ts)
// at InvestigationTimeline's own progress/playbackMode. This is purely a
// GeoJSON source/layer pair — all geometry math lives in
// `features/maritime-map/utils/organicPolygon.ts` and
// `oilSlickKeyframes.ts`; there is no independent animation loop here or in
// the caller. Kept separate from the marching-ants line layers above so
// Focus Mode can be added/removed independently without touching the
// existing (default) rendering.

const FOCUS_SOURCE_ID = 'drift-focus-source';
const FOCUS_FILL_ID = 'drift-focus-fill';
const FOCUS_OUTLINE_ID = 'drift-focus-outline';

/**
 * Base (unfaded) paint opacities for the traveling focus polygon. Named here
 * so `addFocusPolygon`'s initial paint and `updateFocusPolygon`'s per-progress
 * fade multiply the SAME numbers — see `updateFocusPolygon`'s
 * `opacityMultiplier` param, driven by
 * `oilSlickKeyframes.ts`'s `detectionHandoffOpacity`.
 */
const FOCUS_FILL_BASE_OPACITY = 0.5;
const FOCUS_OUTLINE_BASE_OPACITY = 0.95;

/** GeoJSON Polygon coordinates: one ring, [lon, lat] pairs, closed. */
export type FocusPolygonCoordinates = number[][][];

function emptyPolygonFeature() {
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [] as number[][][] },
    properties: {},
  };
}

export function addFocusPolygon(map: Map) {
  if (!map.getSource(FOCUS_SOURCE_ID)) {
    map.addSource(FOCUS_SOURCE_ID, {
      type: 'geojson',
      data: emptyPolygonFeature(),
    });
  }

  // Red is deliberate: distinct from the teal/blue drift-line layers above
  // (#38bdf8) and from the vessel rank markers (gold #facc15, slate-blue
  // #94a3b8, orange #fb923c — see VesselLayer.ts's rankColor) so the oil-slick
  // polygon never gets visually confused with either.
  if (!map.getLayer(FOCUS_FILL_ID)) {
    map.addLayer({
      id: FOCUS_FILL_ID,
      type: 'fill',
      source: FOCUS_SOURCE_ID,
      paint: {
        'fill-color': '#ff3b30',
        'fill-opacity': FOCUS_FILL_BASE_OPACITY,
      },
    });
  }

  if (!map.getLayer(FOCUS_OUTLINE_ID)) {
    map.addLayer({
      id: FOCUS_OUTLINE_ID,
      type: 'line',
      source: FOCUS_SOURCE_ID,
      paint: {
        'line-color': '#dc2626',
        'line-width': 2,
        'line-opacity': FOCUS_OUTLINE_BASE_OPACITY,
      },
    });
  }
}

/**
 * Push a new polygon shape into the existing focus-mode source (no re-add),
 * and apply the detection-handoff fade to both the fill and outline layers.
 *
 * `opacityMultiplier` (0..1, default 1 = fully visible/unfaded) is expected
 * to come from `oilSlickKeyframes.ts`'s `detectionHandoffOpacity(progress,
 * direction)` — see MaritimeMap.tsx's call site. It's applied here (rather
 * than baked into the source data) so the SAME base paint values
 * `addFocusPolygon` sets stay the single source of truth; this just scales
 * them via `setPaintProperty`, the same dynamic-paint-update pattern already
 * used for the marching-ants dash layer above.
 */
export function updateFocusPolygon(
  map: Map,
  coordinates: FocusPolygonCoordinates | null,
  opacityMultiplier: number = 1
) {
  const source = map.getSource(FOCUS_SOURCE_ID) as GeoJSONSource | undefined;
  if (!source) return;

  source.setData(
    coordinates && coordinates.length > 0 && coordinates[0].length > 0
      ? {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates },
          properties: {},
        }
      : emptyPolygonFeature()
  );

  const clampedMultiplier = Math.min(1, Math.max(0, opacityMultiplier));
  if (map.getLayer(FOCUS_FILL_ID)) {
    map.setPaintProperty(FOCUS_FILL_ID, 'fill-opacity', FOCUS_FILL_BASE_OPACITY * clampedMultiplier);
  }
  if (map.getLayer(FOCUS_OUTLINE_ID)) {
    map.setPaintProperty(FOCUS_OUTLINE_ID, 'line-opacity', FOCUS_OUTLINE_BASE_OPACITY * clampedMultiplier);
  }
}

export function removeFocusPolygon(map: Map) {
  [FOCUS_OUTLINE_ID, FOCUS_FILL_ID].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(FOCUS_SOURCE_ID)) map.removeSource(FOCUS_SOURCE_ID);
}
