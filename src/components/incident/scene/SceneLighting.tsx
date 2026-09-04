import React from 'react';

export const SceneLighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.6} color="#4a769c" />
      <directionalLight 
        position={[30, 40, 60]} 
        intensity={1.2} 
        color="#c9e1f5"
        castShadow 
      />
      <hemisphereLight 
        color="#c9e1f5" 
        groundColor="#071524" 
        intensity={0.4} 
      />
    </>
  );
};
