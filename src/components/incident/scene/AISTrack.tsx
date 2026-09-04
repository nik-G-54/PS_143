import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { latLonToWorld, VESSEL_SURFACE_OFFSET } from '../../../utils/coordinates';
import { useIncident } from '../../../context/IncidentContext';
import { AISTrackPoint } from '../../../types/api';

interface AISTrackProps {
  track: any[];
}

export const AISTrack: React.FC<AISTrackProps> = ({ track }) => {
  const { spillDetails, backtrackData } = useIncident();

  if (!track || track.length < 2) return null;

  const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  // Convert geographic coordinates to 3D world positions
  const points = useMemo(() => {
    return track.map((pos: any) => {
      const lat = pos.latitude ?? pos.lat;
      const lng = pos.longitude ?? pos.lng;
      const worldPos = latLonToWorld(lat, lng, originLat, originLon);
      // Lift the track slightly above the ocean surface to avoid z-fighting
      return new Vector3(worldPos.x, worldPos.y + VESSEL_SURFACE_OFFSET + 0.1, worldPos.z);
    });
  }, [track, originLat, originLon]);

  if (points.length < 2) return null;

  const startPoint = points[0];

  return (
    <group>
      {/* The main AIS track line */}
      <Line 
        points={points}
        color="#22d3ee"
        lineWidth={3}
        transparent
        opacity={0.9}
      />

      {/* Track Start Marker */}
      <mesh position={[startPoint.x, startPoint.y, startPoint.z]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#67e8f9" />
      </mesh>
    </group>
  );
};
