import React from 'react';
import { SceneCamera } from './SceneCamera';
import { SceneLighting } from './SceneLighting';
import { SceneGrid } from './SceneGrid';
import { OceanSurface } from './OceanSurface';
import { IncidentMarker } from './IncidentMarker';
import { TestPointMarker } from './TestPointMarker';
import { OrientationIndicator } from './OrientationIndicator';
import { VesselModel } from './VesselModel';
import { latLonToWorld, VESSEL_SURFACE_OFFSET } from '../../../utils/coordinates';
import { mockIncident } from '../../../data/mockIncident';

export const IncidentScene: React.FC = () => {
  const originLat = mockIncident.location.lat;
  const originLon = mockIncident.location.lng;

  // Incident origin
  const incidentPos = latLonToWorld(originLat, originLon, originLat, originLon);
  
  // Test coordinate: slightly Northeast (13.20 N, 80.35 E)
  const testPos = latLonToWorld(13.20, 80.35, originLat, originLon);

  // Vessel mock data
  const vessel = mockIncident.vessel;
  // Fallback to origin if coordinates are missing (though mock guarantees them)
  const vesselLat = vessel.lat ?? originLat;
  const vesselLon = vessel.lng ?? originLon;
  const vesselPos = latLonToWorld(vesselLat, vesselLon, originLat, originLon);

  return (
    <>
      <SceneCamera />
      <SceneLighting />
      <OceanSurface />
      <SceneGrid />
      <IncidentMarker position={[incidentPos.x, incidentPos.y, incidentPos.z]} />
      <TestPointMarker position={[testPos.x, testPos.y, testPos.z]} />
      
      {/* Vessel rendering */}
      <VesselModel 
        position={[vesselPos.x, vesselPos.y + VESSEL_SURFACE_OFFSET, vesselPos.z]} 
        heading={vessel.heading ?? 0} 
        id={vessel.id} 
        status={vessel.status ?? 'UNKNOWN'} 
      />
      
      <OrientationIndicator />
    </>
  );
};
