import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../../context/SimulationContext';
import { useInteraction } from '../../../pages/IncidentReconstructionPage';
import { latLonToWorld, OIL_SURFACE_OFFSET, METERS_PER_WORLD_UNIT } from '../../../utils/coordinates';
import { useIncident } from '../../../context/IncidentContext';
import { resolveTrajectoryPosition } from '../../../utils/trajectory';
import { computeTrajectoryStats } from '../../../utils/trajectoryStats';

function createIrregularSpillShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const points = 48;
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2;
    const wobble =
      0.72 +
      0.22 * Math.sin(t * 3.1) +
      0.14 * Math.cos(t * 5.4) +
      0.09 * Math.sin(t * 8.2 + 0.6);
    const x = Math.cos(t) * radius * wobble * 1.35;
    const y = Math.sin(t) * radius * wobble * 0.88;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export const OilSpill: React.FC = () => {
  const { progress, direction } = useSimulation();
  const { spillDetails, backtrackData } = useIncident();
  const { setSelectedObject } = useInteraction();
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const transform = useMemo(() => {
    const originLat =
      backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
    const originLon =
      backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

    let spillLat =
      backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
    let spillLon =
      backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

    if (backtrackData?.backtrack.trajectory && backtrackData.backtrack.trajectory.length > 0) {
      const startTimeMs = Date.parse(backtrackData.backtrack.estimated_release_time);
      const endTimeMs = Date.parse(backtrackData.backtrack.observation.timestamp);
      const resolvedPos = resolveTrajectoryPosition(
        backtrackData.backtrack.trajectory,
        progress,
        startTimeMs,
        endTimeMs,
        direction
      );
      if (resolvedPos) {
        spillLat = resolvedPos.latitude;
        spillLon = resolvedPos.longitude;
      }
    }

    const pos = latLonToWorld(spillLat, spillLon, originLat, originLon);

    // Spread factor: full size at observation, smaller near release — always visible
    const spread =
      direction === 'BACKTRACK' ? Math.max(0.28, 1 - progress * 0.72) : Math.max(0.28, 0.28 + progress * 0.72);

    const areaKm2 = spillDetails?.area_km2 ?? 2.5;
    const areaRadiusM = Math.sqrt((areaKm2 * 1_000_000) / Math.PI);
    // Prefer detected spill area for visibility — source radius is often too small to see
    const radiusMeters = Math.max(areaRadiusM, 900);
    const radiusUnits = Math.max((radiusMeters / METERS_PER_WORLD_UNIT) * spread, 10);

    const shape = createIrregularSpillShape(radiusUnits);

    const stats = computeTrajectoryStats(backtrackData?.backtrack.trajectory);
    const elapsedFraction = direction === 'BACKTRACK' ? 1 - progress : progress;
    const coveredKm = stats ? stats.totalDistanceKm * elapsedFraction : null;
    const coveredHours = stats ? (stats.durationMs / 3_600_000) * elapsedFraction : null;

    const confidence = spillDetails?.confidence_score;

    return {
      pos,
      shape,
      radiusUnits,
      areaKm2,
      confidence,
      coveredKm,
      coveredHours,
      totalKm: stats?.totalDistanceKm ?? null,
      totalHours: stats ? stats.durationMs / 3_600_000 : null,
    };
  }, [progress, backtrackData, direction, spillDetails]);

  useFrame((state) => {
    if (!pulseRef.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08;
    pulseRef.current.scale.set(s, s, 1);
  });

  const handlePointerDown = (e: any) => {
    clickStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    if (!clickStartRef.current) return;
    const dx = e.clientX - clickStartRef.current.x;
    const dy = e.clientY - clickStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      e.stopPropagation();
      setSelectedObject({
        type: 'oil',
        id: backtrackData?.spill_id ?? spillDetails?.spill_id ?? 'spill',
      });
    }
    clickStartRef.current = null;
  };

  return (
    <group
      position={[transform.pos.x, OIL_SURFACE_OFFSET, transform.pos.z]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Outer glow halo — high visibility */}
        <mesh ref={pulseRef} position={[0, 0, 0.002]} scale={[1.35, 1.35, 1]}>
          <shapeGeometry args={[transform.shape]} />
          <meshBasicMaterial
            color="#ff3b30"
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Dark oil body */}
        <mesh position={[0, 0, 0.01]}>
          <shapeGeometry args={[transform.shape]} />
          <meshBasicMaterial
            color="#1a0a05"
            transparent
            opacity={0.92}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Sheen / edge */}
        <mesh position={[0, 0, 0.018]} scale={[0.92, 0.92, 1]}>
          <shapeGeometry args={[transform.shape]} />
          <meshBasicMaterial
            color="#c2410c"
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Bright rim ring */}
        <mesh position={[0, 0, 0.022]}>
          <ringGeometry args={[transform.radiusUnits * 0.95, transform.radiusUnits * 1.12, 48]} />
          <meshBasicMaterial
            color="#ef4444"
            transparent
            opacity={0.85}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      <Html position={[0, 4.2, 0]} center zIndexRange={[90, 0]} distanceFactor={48}>
        <div className="bg-red-950/90 border border-red-500/60 px-2.5 py-1.5 rounded-md flex flex-col items-center pointer-events-none backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.55)] min-w-[160px]">
          <span className="text-[10px] text-red-400 font-bold tracking-widest whitespace-nowrap">
            OIL SPILL
          </span>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[8px] font-mono text-slate-200">
            {typeof transform.areaKm2 === 'number' && (
              <span className="text-orange-200">{transform.areaKm2.toFixed(2)} km²</span>
            )}
            {typeof transform.confidence === 'number' && (
              <span className="text-emerald-300">
                {(transform.confidence <= 1
                  ? transform.confidence * 100
                  : transform.confidence
                ).toFixed(0)}
                %
              </span>
            )}
            {transform.coveredKm != null && (
              <span className="col-span-2 text-amber-200">
                Drift {transform.coveredKm.toFixed(1)} / {transform.totalKm?.toFixed(1)} km
              </span>
            )}
            {transform.coveredHours != null && (
              <span className="col-span-2 text-cyan-200">
                Time {transform.coveredHours.toFixed(1)} / {transform.totalHours?.toFixed(1)} h
              </span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
};
