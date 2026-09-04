import React from 'react';
import { useIncident } from '../../../../context/IncidentContext';
import { WindIndicator } from './WindIndicator';
import { CurrentIndicator } from './CurrentIndicator';
import { latLonToWorld } from '../../../../utils/coordinates';

export const EnvironmentIndicators: React.FC = () => {
  const { environment, spillDetails, backtrackData } = useIncident();

  if (!environment) return null;

  const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  // Center indicators around the incident origin
  const center = latLonToWorld(originLat, originLon, originLat, originLon);

  return (
    <group position={[center.x, 0, center.z]}>
      {environment.wind && (
        <WindIndicator 
          u={environment.wind.u} 
          v={environment.wind.v} 
          speed={environment.wind.speed} 
        />
      )}
      {environment.current && (
        <CurrentIndicator 
          u={environment.current.u} 
          v={environment.current.v} 
          speed={environment.current.speed} 
        />
      )}
    </group>
  );
};
