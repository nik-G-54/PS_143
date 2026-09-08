// src/components/map/layers/SourceRadiusCircle.ts
import type { Map } from 'maplibre-gl';
import * as turf from '@turf/turf';

export function addSourceRadius(map: Map, lat: number, lon: number, radiusKm: number) {
  removeSourceRadius(map);

  const sourceId = 'source-radius-source';
  const fillId = 'source-radius-fill';
  const outlineId = 'source-radius-outline';

  const circle = turf.circle([lon, lat], radiusKm, { steps: 64, units: 'kilometers' });

  map.addSource(sourceId, { type: 'geojson', data: circle });

  map.addLayer({
    id: fillId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': '#22d3ee',
      'fill-opacity': 0.08,
    },
  });

  map.addLayer({
    id: outlineId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': '#22d3ee',
      'line-width': 1.5,
      'line-dasharray': [4, 3],
      'line-opacity': 0.7,
    },
  });
}

export function removeSourceRadius(map: Map) {
  ['source-radius-outline', 'source-radius-fill'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource('source-radius-source')) map.removeSource('source-radius-source');
}
