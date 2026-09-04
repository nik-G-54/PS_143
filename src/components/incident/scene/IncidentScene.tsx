import React from 'react';
import { SceneCamera } from './SceneCamera';
import { SceneLighting } from './SceneLighting';
import { SceneGrid } from './SceneGrid';
import { OceanSurface } from './OceanSurface';
import { AISTrack } from './AISTrack';
import { OilSpill } from './OilSpill';
import { IncidentMarker } from './IncidentMarker';
import { OrientationIndicator } from './OrientationIndicator';
import { VesselModel } from './VesselModel';
import { latLonToWorld } from '../../../utils/coordinates';
import { useIncident } from '../../../context/IncidentContext';
import { SourceEstimate } from './SourceEstimate';
import { OilTrajectory } from './OilTrajectory';
import { EnvironmentIndicators } from './environment/EnvironmentIndicators';
import { Sky } from '@react-three/drei';

export const IncidentScene: React.FC = () => {
  const { spillDetails, backtrackData, vesselsData } = useIncident();

  const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  // Incident origin
  const incidentPos = latLonToWorld(originLat, originLon, originLat, originLon);

  return (
    <>
      <Sky 
        distance={450000} 
        sunPosition={[30, 40, 60]} 
        inclination={0.49} 
        azimuth={0.25} 
        turbidity={6}
        rayleigh={4}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <SceneCamera />
      <SceneLighting />
      <OceanSurface />
      <EnvironmentIndicators />
      <OilSpill />
      <OilTrajectory />
      <SourceEstimate />

      <SceneGrid visible={false} />
      <IncidentMarker position={[incidentPos.x, incidentPos.y, incidentPos.z]} />

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

