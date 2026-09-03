import React, { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { useIncident } from '../../../context/IncidentContext';
import { latLonToWorld, OIL_SURFACE_OFFSET } from '../../../utils/coordinates';
import * as THREE from 'three';

export const OilTrajectory: React.FC = () => {
  const { backtrackData } = useIncident();

  const points = useMemo(() => {
    if (!backtrackData?.backtrack.trajectory || backtrackData.backtrack.trajectory.length === 0) return null;

    const originLat = backtrackData.backtrack.observation.latitude;
    const originLon = backtrackData.backtrack.observation.longitude;

    return backtrackData.backtrack.trajectory.map(pt => {
      const pos = latLonToWorld(pt.latitude, pt.longitude, originLat, originLon);
      return new THREE.Vector3(pos.x, OIL_SURFACE_OFFSET + 0.05, pos.z);
    });
  }, [backtrackData]);

  if (!points) return null;

  return (
    <group>
      {/* Main Trajectory Line */}
      <Line
        points={points}
        color="#f59e0b"
        lineWidth={2}
        transparent
        opacity={0.6}
        dashed={true}
        dashScale={1}
        dashSize={2}
        dashOffset={0}
      />

      {/* Point Markers */}
      {points.map((pt, idx) => (
        <group key={idx} position={pt}>
          <mesh>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} />
          </mesh>
          {idx === Math.floor(points.length / 2) && (
            <Html position={[0, 1, 0]} center zIndexRange={[80, 0]} distanceFactor={40}>
              <div className="bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded pointer-events-none backdrop-blur-sm">
                <span className="text-[8px] text-amber-400 font-bold tracking-widest whitespace-nowrap">HISTORICAL TRAJECTORY</span>
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
};