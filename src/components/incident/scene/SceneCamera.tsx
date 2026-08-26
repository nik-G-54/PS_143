import React from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';

export const SceneCamera: React.FC = () => {
  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        position={[20, 30, 40]} // Positioned slightly above and away from the origin
        near={0.1} 
        far={10000} 
      />
      <OrbitControls 
        makeDefault
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera from going below the ground
      />
    </>
  );
};
