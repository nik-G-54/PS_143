import React from 'react';
import { SceneCamera } from './SceneCamera';
import { SceneLighting } from './SceneLighting';
import { SceneGrid } from './SceneGrid';
import { OceanSurface } from './OceanSurface';
import { AISTrack } from './AISTrack';
import { OilSpill } from './OilSpill';
import { IncidentMarker } from './IncidentMarker';
import { TestPointMarker } from './TestPointMarker';
import { OrientationIndicator } from './OrientationIndicator';
import { VesselModel } from './VesselModel';
import { latLonToWorld } from '../../../utils/coordinates';
import { mockIncident } from '../../../data/mockIncident';
import { mockAISTrack } from '../../../data/mockAIS';

export const IncidentScene: React.FC = () => {
  const originLat = mockIncident.location.lat;
  const originLon = mockIncident.location.lng;

  // Incident origin
  const incidentPos = latLonToWorld(originLat, originLon, originLat, originLon);
  
  // Test coordinate: slightly Northeast (13.20 N, 80.35 E)
  const testPos = latLonToWorld(13.20, 80.35, originLat, originLon);

  // Vessel mock data (used for ID and status)
  const vessel = mockIncident.vessel;

  return (
    <>
      <SceneCamera />
      <SceneLighting />
      <OceanSurface />
      <OilSpill />
      <AISTrack track={mockAISTrack} />
      <SceneGrid />
      <IncidentMarker position={[incidentPos.x, incidentPos.y, incidentPos.z]} />
      <TestPointMarker position={[testPos.x, testPos.y, testPos.z]} />
      
      {/* Vessel rendering - Position and heading are now driven by SimulationContext */}
      <VesselModel 
        id={vessel.id} 
        status={vessel.status ?? 'UNKNOWN'} 
      />
      
      <OrientationIndicator />
    </>
  );
};
