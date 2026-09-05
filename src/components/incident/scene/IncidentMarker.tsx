import React from 'react';
import { Html } from '@react-three/drei';

interface IncidentMarkerProps {
  position: [number, number, number];
}

/** Observation-point anchor at the spill detection location. */
export const IncidentMarker: React.FC<IncidentMarkerProps> = ({ position }) => {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.85} />
      </mesh>

      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 7, 12]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.35} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.9, 1.15, 32]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.7} side={2} />
      </mesh>

      <Html position={[0, 7.2, 0]} center zIndexRange={[92, 0]} distanceFactor={55}>
        <div className="pointer-events-none bg-red-950/80 border border-red-500/45 px-1.5 py-0.5 rounded backdrop-blur-sm">
          <span className="text-[8px] text-red-200 font-bold tracking-widest whitespace-nowrap">
            OBSERVATION
          </span>
        </div>
      </Html>
    </group>
  );
};
