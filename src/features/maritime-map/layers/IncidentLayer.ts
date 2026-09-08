import { ScatterplotLayer } from '@deck.gl/layers';
import { MockIncident } from '../deck/layerTypes';

export function createIncidentLayer(data: MockIncident[]) {
  return new ScatterplotLayer<MockIncident>({
    id: 'incident-layer',
    data,
    getPosition: (d: MockIncident) => [d.longitude, d.latitude],
    getFillColor: [239, 68, 68, 200], // Red-500
    getRadius: 50000, // 50km radius so it's visible on zoomed-out globe
    radiusUnits: 'meters',
    stroked: true,
    getLineColor: [255, 255, 255, 255],
    lineWidthMinPixels: 2,
    pickable: true,
  });
}
