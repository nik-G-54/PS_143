import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulation } from '../../../context/SimulationContext';
import { useInteraction } from '../../../pages/IncidentReconstructionPage';
import { latLonToWorld, OIL_SURFACE_OFFSET, METERS_PER_WORLD_UNIT } from '../../../utils/coordinates';
import { useIncident } from '../../../context/IncidentContext';
import { resolveTrajectoryPosition } from '../../../utils/trajectory';

function extractPolygonRing(spillDetails: any): number[][] | null {
  const coords = spillDetails?.polygon?.coordinates;
  if (!Array.isArray(coords) || !Array.isArray(coords[0]) || coords[0].length < 4) return null;
  return coords[0];
}

function createIrregularSpillShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const points = 36;
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * Math.PI * 2;
    const wobble =
      0.72 +
      0.2 * Math.sin(t * 3.1) +
      0.12 * Math.cos(t * 5.4) +
      0.08 * Math.sin(t * 8.2 + 0.6);
    const x = Math.cos(t) * radius * wobble * 1.45;
    const y = Math.sin(t) * radius * wobble * 0.82;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function ringToShape(
  ring: number[][],
  originLat: number,
  originLon: number,
  spillLat: number,
  spillLon: number
): THREE.Shape {
  const origin = latLonToWorld(spillLat, spillLon, originLat, originLon);
  const shape = new THREE.Shape();
  ring.forEach((coord, i) => {
    const lon = coord[0];
    const lat = coord[1];
    const p = latLonToWorld(lat, lon, originLat, originLon);
    const x = p.x - origin.x;
    const y = -(p.z - origin.z);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

export const OilSpill: React.FC = () => {
  const { progress, direction } = useSimulation();
  const { spillDetails, backtrackData } = useIncident();
  const { setSelectedObject } = useInteraction();
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);

  const transform = useMemo(() => {
    const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
    const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

    let spillLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
    let spillLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

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

    const fallbackAreaKm2 = spillDetails?.area_km2 ?? 12.5;
    const radiusMeters =
      (backtrackData?.backtrack.source_estimate?.radius_km ?? 0) * 1000 ||
      Math.sqrt((fallbackAreaKm2 * 1_000_000) / Math.PI);
    const radiusUnits = Math.max(radiusMeters / METERS_PER_WORLD_UNIT, 4);

    const ring = extractPolygonRing(spillDetails);
    const shape = ring
      ? ringToShape(ring, originLat, originLon, spillLat, spillLon)
      : createIrregularSpillShape(radiusUnits);

    return { pos, shape };
  }, [progress, backtrackData, direction, spillDetails]);

  const handlePointerDown = (e: any) => {
    clickStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    if (!clickStartRef.current) return;
    const dx = e.clientX - clickStartRef.current.x;
    const dy = e.clientY - clickStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      e.stopPropagation();
      setSelectedObject({ type: 'oil', id: backtrackData?.spill_id ?? spillDetails?.spill_id ?? 'spill' });
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
        <mesh position={[0, 0, 0.004]} scale={[1.22, 1.22, 1]}>
          <shapeGeometry args={[transform.shape]} />
          <meshBasicMaterial
            color="#dc2626"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <shapeGeometry args={[transform.shape]} />
          <meshBasicMaterial
            color="#ef4444"
            transparent
            opacity={0.78}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      <Html position={[0, 3, 0]} center zIndexRange={[90, 0]} distanceFactor={40}>
        <div className="bg-red-950/80 border border-red-500/50 px-2 py-1 rounded flex flex-col items-center pointer-events-none backdrop-blur-sm shadow-[0_0_14px_rgba(239,68,68,0.45)]">
          <span className="text-[10px] text-red-400 font-bold tracking-widest whitespace-nowrap">OIL DETECTION</span>
          <span className="text-[8px] text-slate-300 font-mono tracking-widest mt-0.5">
            {backtrackData?.spill_id ?? spillDetails?.spill_id ?? 'UNKNOWN'}
          </span>
        </div>
      </Html>
    </group>
  );
};
