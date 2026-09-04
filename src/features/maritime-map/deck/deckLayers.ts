import { createIncidentLayer } from '../layers/IncidentLayer';
import { createVesselLayer } from '../layers/VesselLayer';
import { createAISTrackLayer } from '../layers/AISTrackLayer';
import { MockIncident, MockVessel, MockAISTrack } from './layerTypes';

// Local mock visualization data for MAP-03
// Mediterranean region to align with initial camera
const mockIncidents: MockIncident[] = [
  { id: 'inc-1', longitude: 15.5, latitude: 35.5, type: 'oil_spill', severity: 'high' }
];

const mockVessels: MockVessel[] = [
  { id: 'ves-1', longitude: 21.0, latitude: 38.5, name: 'Ocean Sentinel Alpha', speed: 12.5 }
];

const mockAISTracks: MockAISTrack[] = [
  {
    id: 'trk-1',
    vesselId: 'ves-1',
    path: [
      [18.0, 37.0],
      [19.0, 37.5],
      [20.0, 38.0],
      [21.0, 38.5]
    ]
  }
];

export function getDeckLayers() {
  return [
    createAISTrackLayer(mockAISTracks),
    createVesselLayer(mockVessels),
    createIncidentLayer(mockIncidents)
  ];
}
