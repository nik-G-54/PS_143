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
import { useIncident } from '../../../context/IncidentContext';
import { SourceEstimate } from './SourceEstimate';
import { OilTrajectory } from './OilTrajectory';

export const IncidentScene: React.FC = () => {
  const { backtrackData, vesselsData } = useIncident();

  const originLat = backtrackData?.backtrack.observation.latitude ?? mockIncident.location.lat;
  const originLon = backtrackData?.backtrack.observation.longitude ?? mockIncident.location.lng;

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
      <OilTrajectory />
      <SourceEstimate />

      <SceneGrid />
      <IncidentMarker position={[incidentPos.x, incidentPos.y, incidentPos.z]} />
      <TestPointMarker position={[testPos.x, testPos.y, testPos.z]} />

      {/* Candidate Vessels and Tracks */}
      {vesselsData?.candidates ? (
        vesselsData.candidates.map(candidate => (
          <React.Fragment key={candidate.vessel_id}>
            {candidate.track ? (
              <AISTrack track={candidate.track} />
            ) : (
              candidate.is_mock && <AISTrack track={mockAISTrack} />
            )}
            
            <VesselModel 
              id={candidate.vessel_id}
              status="CANDIDATE"
              candidate={candidate}
              isLegacyMock={candidate.is_mock}
            />
          </React.Fragment>
        ))
      ) : (
        // Fallback if no vessels data at all (for whatever reason)
        <>
          <AISTrack track={mockAISTrack} />
          <VesselModel 
            id={vessel.id} 
            status={vessel.status ?? 'UNKNOWN'} 
            isLegacyMock={true}
          />
        </>
      )}
      
      <OrientationIndicator />
    </>
  );
};
