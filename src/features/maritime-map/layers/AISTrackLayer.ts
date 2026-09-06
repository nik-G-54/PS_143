import { PathLayer } from '@deck.gl/layers';
import { MockAISTrack } from '../deck/layerTypes';

export function createAISTrackLayer(data: MockAISTrack[]) {
  return new PathLayer<MockAISTrack>({
    id: 'ais-track-layer',
    data,
    getPath: (d: MockAISTrack) => d.path,
    getColor: [245, 158, 11, 200], // Amber-500
    getWidth: 10000, // 10km wide path
    widthUnits: 'meters',
    widthMinPixels: 2,
    pickable: true,
  });
}
