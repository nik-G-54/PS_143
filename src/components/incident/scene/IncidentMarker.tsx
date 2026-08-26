import React from 'react';
import { Html } from '@react-three/drei';

interface IncidentMarkerProps {
  position: [number, number, number];
}

export const IncidentMarker: React.FC<IncidentMarkerProps> = ({ position }) => {
  return (
    <group position={position}>
      {/* Glowing Sphere */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.8} />
      </mesh>
      
      {/* Vertical beam */}
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 10, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
      </mesh>
      
      {/* Ring at the base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[1, 1.2, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.8} side={2} />
      </mesh>

      {/* HTML Label */}
      <Html position={[0, 10, 0]} center zIndexRange={[100, 0]} distanceFactor={40}>
        <div className="bg-red-950/80 border border-red-500/50 px-2 py-1 rounded text-[10px] text-red-200 font-mono tracking-widest whitespace-nowrap backdrop-blur-sm pointer-events-none">
          OIL SPILL INCIDENT
        </div>
      </Html>
    </group>
  );
};
