import React, { useEffect, useMemo, useRef } from 'react';
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useIncident } from '../../../context/IncidentContext';
import { latLonToWorld } from '../../../utils/coordinates';
import { computeTrajectoryStats } from '../../../utils/trajectoryStats';
import { oceanRuntime } from '../../../systems/ocean';
import * as THREE from 'three';
import type { Line2 } from 'three-stdlib';
import { LineGeometry } from 'three-stdlib';
import {
  OIL_TRAJECTORY_GLOW_WIDTH,
  OIL_TRAJECTORY_LINE_WIDTH,
} from '../../../config/reconstructionViz';

/** Keep path slightly above crests so geographic trajectory stays readable. */
const TRAJECTORY_Y_BIAS = 0.35;

type MilestoneViz = {
  index: number;
  timestamp: string;
  isStart?: boolean;
  isEnd?: boolean;
  label: string;
  timeLabel: string;
  distanceFromStartKm: number;
  baseX: number;
  baseZ: number;
};

function pushLinePositions(pts: THREE.Vector3[], out: number[]) {
  out.length = 0;
  for (const p of pts) {
    out.push(p.x, p.y, p.z);
  }
  return out;
}

function syncLineGeometry(line: Line2 | null, flat: number[]) {
  if (!line?.geometry || flat.length < 6) return;
  const geom = line.geometry as LineGeometry;
  geom.setPositions(flat);
  line.computeLineDistances();
}

export const OilTrajectory: React.FC = () => {
  const { backtrackData } = useIncident();
  const pointsRef = useRef<THREE.Vector3[] | null>(null);
  const milestonesRef = useRef<MilestoneViz[]>([]);
  const milestoneGroupsRef = useRef<(THREE.Group | null)[]>([]);
  const mainLineRef = useRef<Line2>(null);
  const glowLineRef = useRef<Line2>(null);
  const coreLineRef = useRef<Line2>(null);
  const posScratch = useRef<number[]>([]);

  const { points, milestones } = useMemo(() => {
    // Cap at 5 meaningful backend timestamps — no invented points.
    const stats = computeTrajectoryStats(backtrackData?.backtrack.trajectory, 5);
    if (!stats) return { points: null, milestones: [] as MilestoneViz[] };

    const originLat = backtrackData!.backtrack.observation.latitude;
    const originLon = backtrackData!.backtrack.observation.longitude;

    const points = stats.points.map((pt) => {
      const pos = latLonToWorld(pt.latitude, pt.longitude, originLat, originLon);
      return new THREE.Vector3(pos.x, TRAJECTORY_Y_BIAS, pos.z);
    });

    const milestones: MilestoneViz[] = stats.milestones.map((m) => {
      const pos = latLonToWorld(m.latitude, m.longitude, originLat, originLon);
      return {
        ...m,
        baseX: pos.x,
        baseZ: pos.z,
      };
    });

    return { points, milestones };
  }, [backtrackData]);

  useEffect(() => {
    pointsRef.current = points;
    milestonesRef.current = milestones;
  }, [points, milestones]);

  useFrame(() => {
    const pts = pointsRef.current;
    if (!pts) return;

    for (const p of pts) {
      p.y = oceanRuntime.height(p.x, p.z) + TRAJECTORY_Y_BIAS;
    }

    const flat = pushLinePositions(pts, posScratch.current);
    syncLineGeometry(glowLineRef.current, flat);
    syncLineGeometry(mainLineRef.current, flat);
    syncLineGeometry(coreLineRef.current, flat);

    const groups = milestoneGroupsRef.current;
    for (let i = 0; i < milestonesRef.current.length; i++) {
      const m = milestonesRef.current[i];
      const g = groups[i];
      if (!g) continue;
      g.position.set(m.baseX, oceanRuntime.height(m.baseX, m.baseZ) + TRAJECTORY_Y_BIAS, m.baseZ);
    }
  });

  if (!points) return null;

  return (
    <group>
      {/* Soft outer glow — primary visual weight for oil path */}
      <Line
        ref={glowLineRef}
        points={points}
        color="#fb923c"
        lineWidth={OIL_TRAJECTORY_GLOW_WIDTH}
        transparent
        opacity={0.28}
      />
      <Line
        ref={mainLineRef}
        points={points}
        color="#f97316"
        lineWidth={OIL_TRAJECTORY_LINE_WIDTH}
        transparent
        opacity={0.92}
      />
      <Line
        ref={coreLineRef}
        points={points}
        color="#fdba74"
        lineWidth={1.6}
        transparent
        opacity={0.7}
      />

      {milestones.map((m, i) => {
        // Alternate offset side to reduce label collisions
        const side = i % 2 === 0 ? 1 : -1;
        const labelY = m.isStart || m.isEnd ? 2.8 : 2.2;
        return (
          <group
            key={`${m.index}-${m.timestamp}`}
            ref={(el) => {
              milestoneGroupsRef.current[i] = el;
            }}
            position={[m.baseX, TRAJECTORY_Y_BIAS, m.baseZ]}
          >
            <mesh>
              <sphereGeometry args={[m.isStart || m.isEnd ? 0.42 : 0.28, 12, 12]} />
              <meshBasicMaterial
                color={m.isStart ? '#22c55e' : m.isEnd ? '#ef4444' : '#f59e0b'}
                transparent
                opacity={0.95}
              />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.72, 24]} />
              <meshBasicMaterial
                color={m.isStart ? '#22c55e' : m.isEnd ? '#ef4444' : '#f59e0b'}
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <Html
              position={[side * 1.6, labelY, 0]}
              center
              zIndexRange={[85, 0]}
              distanceFactor={55}
            >
              <div className="pointer-events-none flex flex-col items-center">
                <div
                  className={`px-1.5 py-0.5 rounded border backdrop-blur-sm ${
                    m.isStart
                      ? 'bg-emerald-950/85 border-emerald-400/45'
                      : m.isEnd
                        ? 'bg-red-950/85 border-red-400/45'
                        : 'bg-amber-950/80 border-amber-400/35'
                  }`}
                >
                  <div
                    className={`text-[8px] font-bold tracking-wider whitespace-nowrap ${
                      m.isStart ? 'text-emerald-300' : m.isEnd ? 'text-red-300' : 'text-amber-300'
                    }`}
                  >
                    {m.isStart ? 'EST. RELEASE' : m.isEnd ? 'OBSERVATION' : m.label}
                  </div>
                  <div className="text-[7px] font-mono text-slate-200 text-center whitespace-nowrap">
                    {m.timeLabel} UTC
                  </div>
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
