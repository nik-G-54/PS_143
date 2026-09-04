import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useSimulation } from '../../../context/SimulationContext';
import { useInteraction } from '../../../pages/IncidentReconstructionPage';
import { latLonToWorld, OIL_SURFACE_OFFSET, METERS_PER_WORLD_UNIT } from '../../../utils/coordinates';
import { useIncident } from '../../../context/IncidentContext';
import { resolveTrajectoryPosition } from '../../../utils/trajectory';

export const OilSpill: React.FC = () => {
  const { progress, direction } = useSimulation();
  const { spillDetails, backtrackData } = useIncident();
  const { setSelectedObject } = useInteraction();
  const clickStartRef = useRef<{ x: number, y: number } | null>(null);

  // Determine if the oil spill should be visible based on simulation time
  const isVisible = useMemo(() => {
    return true; // We now have trajectories guaranteed by the resolver
  }, []);

  // Compute physical position and size
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
    
    // Area in square meters -> radius in meters -> world units
    const fallbackAreaKm2 = spillDetails?.area_km2 ?? 12.5;
    const radiusMeters = (backtrackData?.backtrack.source_estimate?.radius_km ?? 0) * 1000 || Math.sqrt((fallbackAreaKm2 * 1_000_000) / Math.PI);
    const radiusUnits = radiusMeters / METERS_PER_WORLD_UNIT;

    return { pos, radiusUnits };
  }, [progress, backtrackData, direction]);

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

  if (!isVisible) return null;

  return (
    <group 
      position={[transform.pos.x, OIL_SURFACE_OFFSET, transform.pos.z]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      
      {/* Main Irregular Oil Slick */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Core dark patch */}
        <mesh scale={[1.2, 0.8, 1]}>
          <circleGeometry args={[transform.radiusUnits, 64]} />
          <meshPhysicalMaterial 
            color="#0a0502" 
            transparent 
            opacity={0.85} 
            roughness={0.1} 
            metalness={0.8}
            iridescence={0.8}
            iridescenceIOR={1.4}
            iridescenceThicknessRange={[100, 400]}
            clearcoat={0.5}
            clearcoatRoughness={0.1}
          />
        </mesh>
        
        {/* Overlapping subtle patches for irregular shape */}
        <mesh position={[transform.radiusUnits * 0.4, -transform.radiusUnits * 0.2, 0.005]} scale={[0.8, 0.9, 1]} rotation={[0, 0, Math.PI / 4]}>
          <circleGeometry args={[transform.radiusUnits * 0.8, 64]} />
          <meshPhysicalMaterial 
            color="#140a05" 
            transparent 
            opacity={0.7} 
            roughness={0.2} 
            metalness={0.6}
            iridescence={0.6}
            iridescenceIOR={1.3}
          />
        </mesh>
        
        <mesh position={[-transform.radiusUnits * 0.3, transform.radiusUnits * 0.4, -0.005]} scale={[0.7, 0.6, 1]} rotation={[0, 0, -Math.PI / 6]}>
          <circleGeometry args={[transform.radiusUnits * 0.9, 64]} />
          <meshPhysicalMaterial 
            color="#050301" 
            transparent 
            opacity={0.75} 
            roughness={0.15} 
            metalness={0.8}
            iridescence={1.0}
            iridescenceIOR={1.5}
            clearcoat={0.3}
          />
        </mesh>
      </group>

      {/* Detection Marker (Center Pulse/Ring) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1, 1.5, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={2} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.9} />
      </mesh>
      
      {/* Detection Label */}
      <Html position={[0, 3, 0]} center zIndexRange={[90, 0]} distanceFactor={40}>
        <div className="bg-red-950/80 border border-red-500/50 px-2 py-1 rounded flex flex-col items-center pointer-events-none backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.3)]">
          <span className="text-[10px] text-red-400 font-bold tracking-widest whitespace-nowrap">OIL DETECTION</span>
          <span className="text-[8px] text-slate-300 font-mono tracking-widest mt-0.5">{backtrackData?.spill_id ?? spillDetails?.spill_id ?? 'UNKNOWN'}</span>
        </div>
      </Html>

    </group>
  );
};
