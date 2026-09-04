import { ScatterplotLayer } from '@deck.gl/layers';
import { MockVessel } from '../deck/layerTypes';

export function createVesselLayer(data: MockVessel[]) {
  return new ScatterplotLayer<MockVessel>({
    id: 'vessel-layer',
    data,
    getPosition: (d: MockVessel) => [d.longitude, d.latitude],
    getFillColor: [59, 130, 246, 200], // Blue-500
    getRadius: 30000, // 30km radius
    radiusUnits: 'meters',
    stroked: true,
    getLineColor: [255, 255, 255, 255],
    lineWidthMinPixels: 2,
    pickable: true,
  });
}
