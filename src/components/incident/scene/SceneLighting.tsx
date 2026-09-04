import React from 'react';

export const SceneLighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.85} color="#8ec8ea" />
      <directionalLight 
        position={[40, 70, 30]} 
        intensity={1.6} 
        color="#fff4d6"
        castShadow 
      />
      <hemisphereLight 
        color="#d7f0ff" 
        groundColor="#0a4f86" 
        intensity={0.55} 
      />
    </>
  );
};
