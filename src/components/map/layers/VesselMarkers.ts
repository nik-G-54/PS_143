// src/components/map/layers/VesselMarkers.ts
import type { Map } from 'maplibre-gl';
import type { VesselCandidate } from '../../../types/detail';

export function addVesselMarkers(
  map: Map,
  vessels: VesselCandidate[],
  originLat: number,
  originLon: number
) {
  removeVesselMarkers(map);

  if (!vessels || vessels.length === 0) return;

  // We need vessel positions — use the spill's observation point as fallback
  // since the API doesn't return vessel lat/lon directly
  const vesselFeatures = vessels.map((v, i) => {
    // Spread vessels in a semicircle around origin for demo
    const angle = (-Math.PI / 2) + (i * Math.PI / (vessels.length || 1));
    const dist = 0.02 + (v.rank * 0.015); // Spread by rank
    const lon = originLon + dist * Math.cos(angle);
    const lat = originLat + dist * Math.sin(angle);

    return {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [lon, lat] },
      properties: {
        vessel_id: v.vessel_id,
        rank: v.rank,
        name: v.vessel_name || v.vessel_id,
        is_mock: v.is_mock,
        distance_km: v.distance_to_origin_km,
      },
    };
  });

  map.addSource('vessels-source', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: vesselFeatures },
  });

  // Rank badge circles
  map.addLayer({
    id: 'vessels-circles',
    type: 'circle',
    source: 'vessels-source',
    paint: {
      'circle-radius': [
        'case',
        ['==', ['get', 'rank'], 1], 14,
        ['==', ['get', 'rank'], 2], 11,
        9,
      ],
      'circle-color': [
        'case',
        ['==', ['get', 'rank'], 1], '#f97316',  // Orange = #1 suspect
        ['==', ['get', 'rank'], 2], '#eab308',  // Yellow
        '#64748b',                               // Gray
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.9,
    },
  });

  // Rank number labels
  map.addLayer({
    id: 'vessels-labels',
    type: 'symbol',
    source: 'vessels-source',
    layout: {
      'text-field': ['get', 'rank'],
      'text-size': 11,
    },
    paint: {
      'text-color': '#ffffff',
    },
  });

  // Vessel name labels (on hover via setFeatureState)
  map.addLayer({
    id: 'vessels-names',
    type: 'symbol',
    source: 'vessels-source',
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 10,
      'text-offset': [0, 1.5],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#e2e8f0',
      'text-halo-color': '#0f172a',
      'text-halo-width': 1,
    },
  });

  // Dotted arc from #1 vessel to origin
  if (vesselFeatures.length > 0) {
    map.addSource('vessel-arc-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            vesselFeatures[0].geometry.coordinates,
            [originLon, originLat],
          ],
        },
        properties: {},
      },
    });

    map.addLayer({
      id: 'vessel-arc',
      type: 'line',
      source: 'vessel-arc-source',
      paint: {
        'line-color': '#f59e0b',
        'line-width': 2,
        'line-dasharray': [2, 3],
        'line-opacity': 0.7,
      },
    });
  }
}

export function removeVesselMarkers(map: Map) {
  ['vessels-names', 'vessels-labels', 'vessels-circles', 'vessel-arc'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  ['vessels-source', 'vessel-arc-source'].forEach(id => {
    if (map.getSource(id)) map.removeSource(id);
  });
}
