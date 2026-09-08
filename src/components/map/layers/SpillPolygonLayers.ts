// src/components/map/layers/SpillPolygonLayers.ts
import type { Map } from 'maplibre-gl';
import type { SpillDetail } from '../../../types/detail';

export function addSpillPolygon(map: Map, spill: SpillDetail) {
  removeSpillPolygon(map);

  const sourceId = 'spill-polygon-source';
  const glowId = 'spill-polygon-glow';
  const fillId = 'spill-polygon-fill';
  const outlineId = 'spill-polygon-outline';

  // Convert polygon array to GeoJSON
  const geojson = {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [spill.polygon],
      },
      properties: {
        confidence: spill.confidence_score,
        area: spill.area_km2,
      },
    }],
  };

  map.addSource(sourceId, { type: 'geojson', data: geojson });

  // Layer 1: Outer glow (wide, blurred)
  map.addLayer({
    id: glowId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': '#ef4444',
      'line-width': 14,
      'line-blur': 8,
      'line-opacity': 0.5,
    },
  });

  // Layer 2: Fill
  map.addLayer({
    id: fillId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': '#dc2626',
      'fill-opacity': [
        'interpolate', ['linear'], ['get', 'confidence'],
        0.5, 0.15,
        0.9, 0.35,
      ],
    },
  });

  // Layer 3: Crisp outline
  map.addLayer({
    id: outlineId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': '#ef4444',
      'line-width': 2.5,
      'line-opacity': 0.9,
    },
  });
}

export function removeSpillPolygon(map: Map) {
  ['spill-polygon-outline', 'spill-polygon-fill', 'spill-polygon-glow'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource('spill-polygon-source')) map.removeSource('spill-polygon-source');
}
