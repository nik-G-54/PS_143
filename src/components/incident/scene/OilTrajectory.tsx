import React, { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { useIncident } from '../../../context/IncidentContext';
import { latLonToWorld, OIL_SURFACE_OFFSET } from '../../../utils/coordinates';
import { computeTrajectoryStats } from '../../../utils/trajectoryStats';
import * as THREE from 'three';

export const OilTrajectory: React.FC = () => {
  const { backtrackData } = useIncident();

  const { points, milestones, stats } = useMemo(() => {
    const stats = computeTrajectoryStats(backtrackData?.backtrack.trajectory, 6);
    if (!stats) return { points: null, milestones: [], stats: null };

    const originLat = backtrackData!.backtrack.observation.latitude;
    const originLon = backtrackData!.backtrack.observation.longitude;

    const points = stats.points.map((pt) => {
      const pos = latLonToWorld(pt.latitude, pt.longitude, originLat, originLon);
      return new THREE.Vector3(pos.x, OIL_SURFACE_OFFSET + 0.08, pos.z);
    });

    const milestones = stats.milestones.map((m) => {
      const pos = latLonToWorld(m.latitude, m.longitude, originLat, originLon);
      return {
        ...m,
        world: new THREE.Vector3(pos.x, OIL_SURFACE_OFFSET + 0.12, pos.z),
      };
    });

    return { points, milestones, stats };
  }, [backtrackData]);

  if (!points || !stats) return null;

  return (
    <group>
      <Line
        points={points}
        color="#fb923c"
        lineWidth={2.5}
        transparent
        opacity={0.85}
        dashed={false}
      />
      <Line
        points={points}
        color="#fdba74"
        lineWidth={1}
        transparent
        opacity={0.35}
        dashed
        dashSize={1.2}
        gapSize={0.8}
      />

      {milestones.map((m) => (
        <group key={`${m.index}-${m.timestamp}`} position={m.world}>
          <mesh>
            <sphereGeometry args={[m.isStart || m.isEnd ? 0.35 : 0.22, 12, 12]} />
            <meshBasicMaterial
              color={m.isStart ? '#22c55e' : m.isEnd ? '#ef4444' : '#f59e0b'}
              transparent
              opacity={0.95}
            />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.55, 24]} />
            <meshBasicMaterial
              color={m.isStart ? '#22c55e' : m.isEnd ? '#ef4444' : '#f59e0b'}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <Html position={[0, 2.4, 0]} center zIndexRange={[85, 0]} distanceFactor={44}>
            <div className="pointer-events-none flex flex-col items-center">
              <div
                className={`px-1.5 py-0.5 rounded border backdrop-blur-sm shadow-md ${
                  m.isStart
                    ? 'bg-emerald-950/90 border-emerald-400/50'
                    : m.isEnd
                      ? 'bg-red-950/90 border-red-400/50'
                      : 'bg-amber-950/90 border-amber-400/45'
                }`}
              >
                <div
                  className={`text-[9px] font-bold tracking-wider whitespace-nowrap ${
                    m.isStart ? 'text-emerald-300' : m.isEnd ? 'text-red-300' : 'text-amber-300'
                  }`}
                >
                  {m.isStart ? 'RELEASE' : m.isEnd ? 'OBSERVED' : m.label}
                </div>
                <div className="text-[8px] font-mono text-slate-200 text-center whitespace-nowrap">
                  {m.timeLabel} UTC
                </div>
                <div className="text-[7px] font-mono text-slate-400 text-center">
                  {m.distanceFromStartKm.toFixed(1)} km
                </div>
              </div>
            </div>
          </Html>
        </group>
      ))}

      <Html
        position={[
          points[Math.floor(points.length / 2)].x,
          5.5,
          points[Math.floor(points.length / 2)].z,
        ]}
        center
        zIndexRange={[80, 0]}
        distanceFactor={50}
      >
        <div className="bg-slate-950/85 border border-amber-500/40 px-2.5 py-1.5 rounded pointer-events-none backdrop-blur-sm">
          <div className="text-[8px] text-amber-400 font-bold tracking-widest whitespace-nowrap">
            OIL BACKTRACK PATH
          </div>
          <div className="text-[9px] font-mono text-slate-200 mt-0.5 whitespace-nowrap">
            {stats.totalDistanceKm.toFixed(1)} km · {stats.durationLabel}
          </div>
        </div>
      </Html>
    </group>
  );
};
