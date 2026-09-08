import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useIncident } from '../../../context/IncidentContext';
import { useInteraction } from '../../../context/InteractionContext';
import { latLonToWorld, METERS_PER_WORLD_UNIT, OIL_SURFACE_OFFSET } from '../../../utils/coordinates';

export const SourceEstimate: React.FC = () => {
  const { backtrackData } = useIncident();
  const { setSelectedObject } = useInteraction();
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);

  const transform = useMemo(() => {
    if (!backtrackData?.backtrack.source_estimate) return null;

    const originLat = backtrackData.backtrack.observation.latitude;
    const originLon = backtrackData.backtrack.observation.longitude;

    const sourceLat = backtrackData.backtrack.source_estimate.latitude;
    const sourceLon = backtrackData.backtrack.source_estimate.longitude;

    const pos = latLonToWorld(sourceLat, sourceLon, originLat, originLon);

    // Radius from backend only — not altered for visual spacing.
    const radiusMeters = backtrackData.backtrack.source_estimate.radius_km * 1000;
    const radiusUnits = radiusMeters / METERS_PER_WORLD_UNIT;

    return { pos, radiusUnits, radiusKm: backtrackData.backtrack.source_estimate.radius_km };
  }, [backtrackData]);

  if (!transform) return null;

  const handlePointerDown = (e: any) => {
    clickStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    if (!clickStartRef.current) return;
    const dx = e.clientX - clickStartRef.current.x;
    const dy = e.clientY - clickStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      e.stopPropagation();
      setSelectedObject({ type: 'source', id: 'source' });
    }
    clickStartRef.current = null;
  };

  return (
    <group
      position={[transform.pos.x, OIL_SURFACE_OFFSET + 0.01, transform.pos.z]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(transform.radiusUnits - 0.5, 0), transform.radiusUnits, 64]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.55} side={2} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[transform.radiusUnits, 64]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.08} />
      </mesh>

      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.95} />
      </mesh>

      <Html position={[0, 2.4, 0]} center zIndexRange={[88, 0]} distanceFactor={52}>
        <div className="pointer-events-none flex flex-col items-center">
          <div className="bg-amber-950/85 border border-amber-500/45 px-1.5 py-0.5 rounded backdrop-blur-sm">
            <div className="text-[8px] text-amber-300 font-bold tracking-widest whitespace-nowrap">
              SOURCE
            </div>
            <div className="text-[7px] text-amber-200/75 font-mono text-center whitespace-nowrap">
              Radius {transform.radiusKm.toFixed(2)} km
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};
