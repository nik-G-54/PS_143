import React from 'react';
import { Html } from '@react-three/drei';

interface TestPointMarkerProps {
  position: [number, number, number];
}

export const TestPointMarker: React.FC<TestPointMarkerProps> = ({ position }) => {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#eab308" transparent opacity={0.8} />
      </mesh>
      
      <Html position={[0, 2, 0]} center zIndexRange={[100, 0]} distanceFactor={30}>
        <div className="bg-yellow-950/80 border border-yellow-500/50 px-2 py-1 rounded text-[10px] text-yellow-200 font-mono tracking-widest whitespace-nowrap backdrop-blur-sm pointer-events-none">
          TEST POINT
        </div>
      </Html>
    </group>
  );
};
