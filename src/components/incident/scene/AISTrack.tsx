import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { latLonToWorld, VESSEL_SURFACE_OFFSET } from '../../../utils/coordinates';
import { useIncident } from '../../../context/IncidentContext';
import {
  AIS_PRIMARY_LINE_WIDTH,
  AIS_SECONDARY_LINE_WIDTH,
  AIS_SECONDARY_OPACITY,
} from '../../../config/reconstructionViz';

interface AISTrackProps {
  track: any[];
  /** Rank #1 = primary visual weight; others stay secondary. */
  priority?: 'primary' | 'secondary';
}

export const AISTrack: React.FC<AISTrackProps> = ({ track, priority = 'secondary' }) => {
  const { spillDetails, backtrackData } = useIncident();
  const isPrimary = priority === 'primary';

  const originLat =
    backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon =
    backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  const points = useMemo(() => {
    if (!track || track.length < 2) return [];
    return track.map((pos: any) => {
      const lat = pos.latitude ?? pos.lat;
      const lng = pos.longitude ?? pos.lng;
      const worldPos = latLonToWorld(lat, lng, originLat, originLon);
      return new Vector3(worldPos.x, worldPos.y + VESSEL_SURFACE_OFFSET + 0.12, worldPos.z);
    });
  }, [track, originLat, originLon]);

  const nodes = useMemo(() => {
    if (!isPrimary || points.length < 2) return [];
    const step = Math.max(1, Math.floor(points.length / 6));
    const sampled: Vector3[] = [];
    for (let i = 0; i < points.length; i += step) sampled.push(points[i]);
    if (sampled[sampled.length - 1] !== points[points.length - 1]) {
      sampled.push(points[points.length - 1]);
    }
    return sampled;
  }, [points, isPrimary]);

  if (points.length < 2) return null;

  if (isPrimary) {
    return (
      <group>
        <Line
          points={points}
          color="#38bdf8"
          lineWidth={AIS_PRIMARY_LINE_WIDTH + 1.5}
          transparent
          opacity={0.28}
        />
        <Line
          points={points}
          color="#7dd3fc"
          lineWidth={AIS_PRIMARY_LINE_WIDTH}
          transparent
          opacity={0.92}
        />
        {nodes.map((pt, idx) => (
          <mesh key={idx} position={[pt.x, pt.y, pt.z]}>
            <sphereGeometry args={[idx === 0 || idx === nodes.length - 1 ? 0.26 : 0.14, 10, 10]} />
            <meshBasicMaterial color={idx === nodes.length - 1 ? '#e0f2fe' : '#38bdf8'} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      <Line
        points={points}
        color="#64748b"
        lineWidth={AIS_SECONDARY_LINE_WIDTH}
        transparent
        opacity={AIS_SECONDARY_OPACITY}
        dashed
        dashSize={1.6}
        gapSize={1.2}
      />
    </group>
  );
};
