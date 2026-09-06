import React from 'react';
import { SceneCamera } from './SceneCamera';
import { SceneLighting, SceneAtmosphere } from './SceneLighting';
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
import { CulpritMarker } from './CulpritMarker';

export const IncidentScene: React.FC = () => {
  const { spillDetails, backtrackData, vesselsData } = useIncident();
  const { layers } = useSceneLayers();

  const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  const incidentPos = latLonToWorld(originLat, originLon, originLat, originLon);

  return (
    <>
      <SceneAtmosphere />
      <SceneCamera />
      <SceneLighting />
      <OceanSurface />
      <EnvironmentIndicators />
      {layers.oil && <OilSpill />}
      {layers.oil && <OilTrajectory />}
      {layers.source && <SourceEstimate />}

      {layers.grid && <SceneGrid />}
      {layers.oil && (
        <IncidentMarker
          position={[incidentPos.x, incidentPos.y + 0.15, incidentPos.z]}
        />
      )}

      {layers.ais && <CulpritMarker />}

      {layers.ais && vesselsData?.vessels?.map((candidate) => (
        <React.Fragment key={candidate.vessel_id}>
          {candidate.track && (
            <AISTrack
              track={candidate.track}
              priority={candidate.rank === 1 ? 'primary' : 'secondary'}
            />
          )}
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
