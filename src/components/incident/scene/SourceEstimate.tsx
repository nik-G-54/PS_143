import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useIncident } from '../../../context/IncidentContext';
import { latLonToWorld, METERS_PER_WORLD_UNIT, OIL_SURFACE_OFFSET } from '../../../utils/coordinates';

export const SourceEstimate: React.FC = () => {
  const { backtrackData } = useIncident();

  const transform = useMemo(() => {
    if (!backtrackData?.backtrack.source_estimate) return null;

    const originLat = backtrackData.backtrack.observation.latitude;
    const originLon = backtrackData.backtrack.observation.longitude;

    const sourceLat = backtrackData.backtrack.source_estimate.latitude;
    const sourceLon = backtrackData.backtrack.source_estimate.longitude;

    const pos = latLonToWorld(sourceLat, sourceLon, originLat, originLon);
    
    // Radius km -> meters -> world units
    const radiusMeters = backtrackData.backtrack.source_estimate.radius_km * 1000;
    const radiusUnits = radiusMeters / METERS_PER_WORLD_UNIT;

    return { pos, radiusUnits };
  }, [backtrackData]);

  if (!transform) return null;

  return (
    <group position={[transform.pos.x, OIL_SURFACE_OFFSET + 0.01, transform.pos.z]}>
      {/* Source Area Radius */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(transform.radiusUnits - 0.5, 0), transform.radiusUnits, 64]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} side={2} />
      </mesh>
      
      {/* Subtle fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[transform.radiusUnits, 64]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.08} />
      </mesh>

      {/* Center Marker */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} />
      </mesh>
      
      {/* Source Label */}
      <Html position={[0, 2, 0]} center zIndexRange={[90, 0]} distanceFactor={40}>
        <div className="bg-amber-950/80 border border-amber-500/50 px-2 py-1 rounded flex flex-col items-center pointer-events-none backdrop-blur-sm shadow-[0_0_10px_rgba(245,158,11,0.3)]">
          <span className="text-[10px] text-amber-400 font-bold tracking-widest whitespace-nowrap">ESTIMATED SOURCE</span>
          <span className="text-[8px] text-amber-200/70 font-mono tracking-widest mt-0.5">{(backtrackData?.backtrack.source_estimate.radius_km || 0).toFixed(1)} KM RADIUS</span>
        </div>
      </Html>
    </group>
  );
};