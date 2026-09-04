import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { latLonToWorld, VESSEL_SURFACE_OFFSET } from '../../../utils/coordinates';
import { useIncident } from '../../../context/IncidentContext';

interface AISTrackProps {
  track: any[];
}

export const AISTrack: React.FC<AISTrackProps> = ({ track }) => {
  const { spillDetails, backtrackData } = useIncident();

  if (!track || track.length < 2) return null;

  const originLat =
    backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon =
    backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  const points = useMemo(() => {
    return track.map((pos: any) => {
      const lat = pos.latitude ?? pos.lat;
      const lng = pos.longitude ?? pos.lng;
      const worldPos = latLonToWorld(lat, lng, originLat, originLon);
      return new Vector3(worldPos.x, worldPos.y + VESSEL_SURFACE_OFFSET + 0.12, worldPos.z);
    });
  }, [track, originLat, originLon]);

  const nodes = useMemo(() => {
    if (points.length < 2) return [];
    const step = Math.max(1, Math.floor(points.length / 8));
    const sampled: Vector3[] = [];
    for (let i = 0; i < points.length; i += step) sampled.push(points[i]);
    if (sampled[sampled.length - 1] !== points[points.length - 1]) {
      sampled.push(points[points.length - 1]);
    }
    return sampled;
  }, [points]);

  if (points.length < 2) return null;

  return (
    <group>
      <Line
        points={points}
        color="#22d3ee"
        lineWidth={2.5}
        transparent
        opacity={0.55}
        dashed
        dashSize={1.4}
        gapSize={0.9}
      />
      <Line points={points} color="#67e8f9" lineWidth={1.2} transparent opacity={0.95} />

      {nodes.map((pt, idx) => (
        <mesh key={idx} position={[pt.x, pt.y, pt.z]}>
          <sphereGeometry args={[idx === 0 || idx === nodes.length - 1 ? 0.28 : 0.16, 12, 12]} />
          <meshBasicMaterial color={idx === nodes.length - 1 ? '#a5f3fc' : '#22d3ee'} />
        </mesh>
      ))}
    </group>
  );
};
