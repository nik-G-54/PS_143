import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useSimulation } from '../../../context/SimulationContext';
import { mockAISTrack } from '../../../data/mockAIS';
import { latLonToWorld, VESSEL_SURFACE_OFFSET } from '../../../utils/coordinates';
import { mockIncident } from '../../../data/mockIncident';

interface VesselModelProps {
  id: string;
  status: string;
}

export const VesselModel: React.FC<VesselModelProps> = ({ id, status }) => {
  const { progress } = useSimulation();
  
  const originLat = mockIncident.location.lat;
  const originLon = mockIncident.location.lng;

  // Calculate current position and heading based on progress
  const currentData = useMemo(() => {
    if (mockAISTrack.length === 0) return null;
    if (progress <= 0) return mockAISTrack[0];
    if (progress >= 1) return mockAISTrack[mockAISTrack.length - 1];

    const totalSegments = mockAISTrack.length - 1;
    const exactIndex = progress * totalSegments;
    const baseIndex = Math.floor(exactIndex);
    const fraction = exactIndex - baseIndex;

    const p1 = mockAISTrack[baseIndex];
    const p2 = mockAISTrack[baseIndex + 1];

    // Linear interpolation
    return {
      lat: p1.lat + (p2.lat - p1.lat) * fraction,
      lng: p1.lng + (p2.lng - p1.lng) * fraction,
      heading: p1.heading + (p2.heading - p1.heading) * fraction,
    };
  }, [progress]);

  if (!currentData) return null;

  const worldPos = latLonToWorld(currentData.lat, currentData.lng, originLat, originLon);
  const position: [number, number, number] = [worldPos.x, worldPos.y + VESSEL_SURFACE_OFFSET, worldPos.z];
  const rotationY = -currentData.heading * (Math.PI / 180);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Main Hull */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 6]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Bow */}
      <mesh position={[0, 0.5, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.75, 1, 4]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Bridge */}
      <mesh position={[0, 1.5, 2]}>
        <boxGeometry args={[1.2, 1, 1.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.5} />
      </mesh>
      
      {/* Stack */}
      <mesh position={[0, 2.25, 2.3]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 8]} />
        <meshStandardMaterial color="#ef4444" roughness={0.8} />
      </mesh>

      {/* Label */}
      <group rotation={[0, -rotationY, 0]}>
        <Html position={[0, 4, 0]} center zIndexRange={[100, 0]} distanceFactor={40}>
          <div className="bg-slate-900/80 border border-cyan-500/50 px-2 py-1 rounded flex flex-col items-center pointer-events-none backdrop-blur-sm shadow-[0_0_10px_rgba(8,145,178,0.3)]">
            <span className="text-[10px] text-cyan-300 font-mono font-bold tracking-widest whitespace-nowrap">{id}</span>
            <span className="text-[8px] text-slate-400 font-mono tracking-widest">{status}</span>
          </div>
        </Html>
      </group>
    </group>
  );
};
