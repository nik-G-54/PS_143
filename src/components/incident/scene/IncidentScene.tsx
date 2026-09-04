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
import { useSceneLayers } from '../../../context/SceneLayersContext';
import { SourceEstimate } from './SourceEstimate';
import { OilTrajectory } from './OilTrajectory';
import { EnvironmentIndicators } from './environment/EnvironmentIndicators';
import { Sky } from '@react-three/drei';

export const IncidentScene: React.FC = () => {
  const { spillDetails, backtrackData, vesselsData } = useIncident();
  const { layers } = useSceneLayers();

  const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  const incidentPos = latLonToWorld(originLat, originLon, originLat, originLon);

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[40, 70, 50]}
        inclination={0.42}
        azimuth={0.22}
        turbidity={2.4}
        rayleigh={1.2}
        mieCoefficient={0.004}
        mieDirectionalG={0.8}
      />
      <SceneCamera />
      <SceneLighting />
      <OceanSurface />
      <EnvironmentIndicators />
      {layers.oil && <OilSpill />}
      {layers.oil && <OilTrajectory />}
      {layers.source && <SourceEstimate />}

      {layers.grid && <SceneGrid />}
      {layers.oil && (
        <IncidentMarker position={[incidentPos.x, incidentPos.y, incidentPos.z]} />
      )}

      {layers.ais && vesselsData?.vessels?.map(candidate => (
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
