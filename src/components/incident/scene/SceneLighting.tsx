import React from 'react';

export const SceneLighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight 
        args={['#0891b2', '#0f172a', 0.4]} 
      />
      <directionalLight 
        position={[50, 100, 20]} 
        intensity={0.8} 
        color="#ffffff"
      />
    </>
  );
};
