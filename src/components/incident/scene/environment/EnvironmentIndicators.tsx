import React from 'react';
import { useIncident } from '../../../../context/IncidentContext';
import { useSceneLayers } from '../../../../context/SceneLayersContext';
import { WindIndicator } from './WindIndicator';
import { CurrentIndicator } from './CurrentIndicator';
import { latLonToWorld } from '../../../../utils/coordinates';

export const EnvironmentIndicators: React.FC = () => {
  const { environment, spillDetails, backtrackData } = useIncident();
  const { layers } = useSceneLayers();

  if (!environment) return null;

  const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  // Center indicators around the incident origin
  const center = latLonToWorld(originLat, originLon, originLat, originLon);

  const toUV = (flow?: { u?: number; v?: number; speed?: number; direction?: number }) => {
    if (!flow) return { u: 0, v: 0, speed: 0 };
    if (typeof flow.u === 'number' && typeof flow.v === 'number') {
      return { u: flow.u, v: flow.v, speed: flow.speed ?? Math.hypot(flow.u, flow.v) };
    }
    const speed = flow.speed ?? 0;
    const rad = ((flow.direction ?? 0) * Math.PI) / 180;
    return { u: Math.sin(rad) * speed, v: Math.cos(rad) * speed, speed };
  };

  const wind = toUV(environment.wind);
  const current = toUV(environment.current);

  return (
    <group position={[center.x, 0, center.z]}>
      {layers.wind && (
        <WindIndicator u={wind.u} v={wind.v} speed={wind.speed} />
      )}
      {layers.current && (
        <CurrentIndicator u={current.u} v={current.v} speed={current.speed} />
      )}
    </group>
  );
};
