// src/components/map/layers/DriftTrajectory.ts
import type { Map, GeoJSONSource } from 'maplibre-gl';
import type { VisualizationData } from '../../../types/detail';
import {
  buildOilPatchFillBands,
  buildOilPatchGlowBands,
  buildOilPatchIsolines,
  buildOilPatchSpeckles,
  smoothRing,
} from '../../../features/maritime-map/utils/oilPatchGeometry';
import type { OilPatchBand } from '../../../features/maritime-map/utils/oilPatchGeometry';

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

const FOCUS_GLOW_SOURCE_ID = 'drift-focus-glow-source';
const FOCUS_GLOW_FILL_ID = 'drift-focus-glow-fill';
const FOCUS_FILL_SOURCE_ID = 'drift-focus-fill-source';
const FOCUS_FILL_ID = 'drift-focus-fill';
/** Outline-only isolines (fed through the glow source, `kind: 'line'`). */
const FOCUS_ISOLINE_ID = 'drift-focus-isolines';
/** Hairline contour step on each inner fill band. */
const FOCUS_CONTOUR_ID = 'drift-focus-contours';

/** GeoJSON Polygon coordinates: one ring, [lon, lat] pairs, closed. */
export type FocusPolygonCoordinates = number[][][];

function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

/**
 * One band per feature, each carrying its own colour/opacity as GeoJSON
 * properties — lets a single `fill` layer paint every band via a
 * `['get', ...]` data expression instead of needing one source+layer pair
 * per band. Render order follows array order (`buildOilPatchFillBands`/
 * `buildOilPatchGlowBands` already order widest/boundary-first), matching
 * how MapLibre draws a GeoJSON source's features in the order they appear.
 */
function bandsToFeatureCollection(bands: OilPatchBand[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: bands.map((band) => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [band.ring] },
      properties: {
        kind: band.kind,
        color: `rgb(${band.rgb[0]}, ${band.rgb[1]}, ${band.rgb[2]})`,
        opacity: band.alpha / 255,
        hasLine: band.line != null,
        lineColor: band.line ? `rgb(${band.line.rgb[0]}, ${band.line.rgb[1]}, ${band.line.rgb[2]})` : 'rgb(0,0,0)',
        lineOpacity: band.line ? band.line.alpha / 255 : 0,
      },
    })),
  };
}

export function addFocusPolygon(map: Map) {
  if (!map.getSource(FOCUS_GLOW_SOURCE_ID)) {
    map.addSource(FOCUS_GLOW_SOURCE_ID, { type: 'geojson', data: emptyFeatureCollection() });
  }
  if (!map.getSource(FOCUS_FILL_SOURCE_ID)) {
    map.addSource(FOCUS_FILL_SOURCE_ID, { type: 'geojson', data: emptyFeatureCollection() });
  }

  // A warm dark-core/amber-sheen gradient + soft outward glow (see
  // `oilPatchGeometry.ts` and `spillEncoding.ts`'s `OIL_PATCH_STOPS`/
  // `OIL_GLOW_STOPS`) in place of one flat red fill + a hard stroke — real
  // oil doesn't render as a single flat tint with a ruled border. Distinct
  // from the teal/blue drift-line layers above (#38bdf8) and from the vessel
  // rank markers (gold #facc15, slate-blue #94a3b8, orange #fb923c — see
  // VesselLayer.ts's rankColor) so the oil-slick polygon never gets visually
  // confused with either.
  if (!map.getLayer(FOCUS_ISOLINE_ID)) {
    map.addLayer({
      id: FOCUS_ISOLINE_ID,
      type: 'line',
      source: FOCUS_GLOW_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'line'],
      paint: {
        'line-color': ['get', 'color'],
        'line-opacity': ['get', 'opacity'],
        'line-width': 1,
      },
    });
  }

  if (!map.getLayer(FOCUS_GLOW_FILL_ID)) {
    map.addLayer({
      id: FOCUS_GLOW_FILL_ID,
      type: 'fill',
      source: FOCUS_GLOW_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'fill'],
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': ['get', 'opacity'],
      },
    });
  }

  if (!map.getLayer(FOCUS_FILL_ID)) {
    map.addLayer({
      id: FOCUS_FILL_ID,
      type: 'fill',
      source: FOCUS_FILL_SOURCE_ID,
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': ['get', 'opacity'],
      },
    });
  }

  if (!map.getLayer(FOCUS_CONTOUR_ID)) {
    map.addLayer({
      id: FOCUS_CONTOUR_ID,
      type: 'line',
      source: FOCUS_FILL_SOURCE_ID,
      filter: ['==', ['get', 'hasLine'], true],
      paint: {
        'line-color': ['get', 'lineColor'],
        'line-opacity': ['get', 'lineOpacity'],
        'line-width': 0.8,
      },
    });
  }
}

/**
 * Push a new polygon shape into the existing focus-mode sources (no re-add),
 * and apply the detection-handoff fade to every band's opacity.
 *
 * `opacityMultiplier` (0..1, default 1 = fully visible/unfaded) is expected
 * to come from `oilSlickKeyframes.ts`'s `detectionHandoffOpacity(progress,
 * direction)` — see MaritimeMap.tsx's call site. Baked into each band's own
 * `opacity` property (rather than a paint-property multiply, which would
 * need a `['*', ...]` expression rebuilt on every call anyway) since the
 * bands are already being rebuilt here on every progress tick.
 *
 * Runs on every play-tick/slider-drag update, same as before — the band
 * geometry comes from `oilPatchGeometry.ts`'s cheap centroid-scaling, not
 * true polygon buffering, specifically so this stays safe at animation-frame
 * rate (see that file's docstring).
 */
export function updateFocusPolygon(
  map: Map,
  coordinates: FocusPolygonCoordinates | null,
  opacityMultiplier: number = 1
) {
  const glowSource = map.getSource(FOCUS_GLOW_SOURCE_ID) as GeoJSONSource | undefined;
  const fillSource = map.getSource(FOCUS_FILL_SOURCE_ID) as GeoJSONSource | undefined;
  if (!glowSource || !fillSource) return;

  const ring = coordinates && coordinates.length > 0 && coordinates[0].length >= 4 ? coordinates[0] : null;

  if (!ring) {
    glowSource.setData(emptyFeatureCollection());
    fillSource.setData(emptyFeatureCollection());
    return;
  }

  const clampedMultiplier = Math.min(1, Math.max(0, opacityMultiplier));
  const smoothed = smoothRing(ring);
  const fade = (band: OilPatchBand): OilPatchBand => ({
    ...band,
    alpha: band.alpha * clampedMultiplier,
    line: band.line ? { ...band.line, alpha: band.line.alpha * clampedMultiplier } : undefined,
  });

  glowSource.setData(
    bandsToFeatureCollection([...buildOilPatchIsolines(smoothed), ...buildOilPatchGlowBands(smoothed)].map(fade))
  );
  fillSource.setData(
    bandsToFeatureCollection([...buildOilPatchFillBands(smoothed), ...buildOilPatchSpeckles(smoothed)].map(fade))
  );
}

export function removeFocusPolygon(map: Map) {
  [FOCUS_CONTOUR_ID, FOCUS_FILL_ID, FOCUS_GLOW_FILL_ID, FOCUS_ISOLINE_ID].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  [FOCUS_FILL_SOURCE_ID, FOCUS_GLOW_SOURCE_ID].forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });
}
