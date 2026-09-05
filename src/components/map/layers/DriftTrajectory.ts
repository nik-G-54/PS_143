// src/components/map/layers/DriftTrajectory.ts
import type { Map } from 'maplibre-gl';
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
