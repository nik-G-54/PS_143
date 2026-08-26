import React from 'react';
import { MeshDistortMaterial } from '@react-three/drei';

export const OceanSurface: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      {/* 1000x1000 meters plane with 64x64 segments for vertex displacement */}
      <planeGeometry args={[1000, 1000, 64, 64]} />
      <MeshDistortMaterial 
        color="#081e3f" // Dark navy/maritime color
        distort={0.1}   // Subtle wave displacement
        speed={1}       // Subtle animation speed
        roughness={0.2} 
        metalness={0.8}
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  );
};
