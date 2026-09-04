import React from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';

export const SceneCamera: React.FC = () => {
  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        position={[45, 20, 65]} 
        fov={45} 
        near={0.1} 
        far={3000} 
      />
      <OrbitControls 
        makeDefault
        target={[0, 0, 0]}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2 - 0.05} // Keep camera above water
      />
    </>
  );
};
