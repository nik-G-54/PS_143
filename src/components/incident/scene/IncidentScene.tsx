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
import { useIncident } from '../../../context/IncidentContext';
import { SourceEstimate } from './SourceEstimate';
import { OilTrajectory } from './OilTrajectory';

export const IncidentScene: React.FC = () => {
  const { spillDetails, backtrackData, vesselsData } = useIncident();

  const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  // Incident origin
  const incidentPos = latLonToWorld(originLat, originLon, originLat, originLon);
  
  // Test coordinate: slightly Northeast (we just use origin + small offset for test)
  const testPos = latLonToWorld(originLat + 0.02, originLon + 0.03, originLat, originLon);

  return (
    <>
      <SceneCamera />
      <SceneLighting />
      <OceanSurface />
      <OilSpill />
      <OilTrajectory />
      <SourceEstimate />

      <SceneGrid />
      <IncidentMarker position={[incidentPos.x, incidentPos.y, incidentPos.z]} />
      <TestPointMarker position={[testPos.x, testPos.y, testPos.z]} />

      {/* Candidate Vessels and Tracks */}
      {vesselsData?.vessels?.map(candidate => (
        <React.Fragment key={candidate.vessel_id}>
          {candidate.track && <AISTrack track={candidate.track} />}
          <VesselModel 
            id={candidate.vessel_id}
            status="CANDIDATE"
            candidate={candidate}
          />
        </React.Fragment>
      ))}
      
      <OrientationIndicator />
    </>
  );
};
