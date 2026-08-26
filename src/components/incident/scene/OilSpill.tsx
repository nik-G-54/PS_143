import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useSimulation } from '../../../context/SimulationContext';
import { mockOilSpill } from '../../../data/mockOilSpill';
import { mockAISTrack } from '../../../data/mockAIS';
import { latLonToWorld, OIL_SURFACE_OFFSET, METERS_PER_WORLD_UNIT } from '../../../utils/coordinates';
import { mockIncident } from '../../../data/mockIncident';

const timeToMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const OilSpill: React.FC = () => {
  const { progress } = useSimulation();

  // Determine if the oil spill should be visible based on simulation time
  const isVisible = useMemo(() => {
    if (!mockAISTrack.length) return false;
    
    const startMins = timeToMins(mockAISTrack[0].timestamp);
    const endMins = timeToMins(mockAISTrack[mockAISTrack.length - 1].timestamp);
    const currentMins = startMins + progress * (endMins - startMins);
    const detectedMins = timeToMins(mockOilSpill.detectedAt);

    return currentMins >= detectedMins;
  }, [progress]);

  // Compute physical position and size
  const transform = useMemo(() => {
    const originLat = mockIncident.location.lat;
    const originLon = mockIncident.location.lng;

    const pos = latLonToWorld(mockOilSpill.latitude, mockOilSpill.longitude, originLat, originLon);
    
    // Area in square meters -> radius in meters -> world units
    const areaM2 = mockOilSpill.areaKm2 * 1_000_000;
    const radiusMeters = Math.sqrt(areaM2 / Math.PI);
    const radiusUnits = radiusMeters / METERS_PER_WORLD_UNIT;

    return { pos, radiusUnits };
  }, []);

  if (!isVisible) return null;

  return (
    <group position={[transform.pos.x, OIL_SURFACE_OFFSET, transform.pos.z]}>
      
      {/* Main Irregular Oil Slick */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Core dark patch */}
        <mesh scale={[1.2, 0.8, 1]}>
          <circleGeometry args={[transform.radiusUnits, 32]} />
          <meshStandardMaterial color="#1a120b" transparent opacity={0.85} roughness={0.2} metalness={0.7} />
        </mesh>
        
        {/* Overlapping subtle patches for irregular shape */}
        <mesh position={[transform.radiusUnits * 0.4, -transform.radiusUnits * 0.2, 0.01]} scale={[0.8, 0.9, 1]} rotation={[0, 0, Math.PI / 4]}>
          <circleGeometry args={[transform.radiusUnits * 0.8, 32]} />
          <meshStandardMaterial color="#291a10" transparent opacity={0.7} roughness={0.3} metalness={0.6} />
        </mesh>
        
        <mesh position={[-transform.radiusUnits * 0.3, transform.radiusUnits * 0.4, -0.01]} scale={[0.7, 0.6, 1]} rotation={[0, 0, -Math.PI / 6]}>
          <circleGeometry args={[transform.radiusUnits * 0.9, 32]} />
          <meshStandardMaterial color="#0f0a05" transparent opacity={0.75} roughness={0.2} metalness={0.8} />
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
          <span className="text-[8px] text-slate-300 font-mono tracking-widest mt-0.5">{mockOilSpill.id} • {mockOilSpill.confidence}% CONF</span>
        </div>
      </Html>

    </group>
  );
};
