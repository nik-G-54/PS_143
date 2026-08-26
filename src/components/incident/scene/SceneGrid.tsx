import React from 'react';

export const SceneGrid: React.FC = () => {
  return (
    <gridHelper 
      args={[1000, 100, '#164e63', '#0f172a']} // cyan-900 center, slate-900 grid lines
      position={[0, -0.1, 0]} 
    />
  );
};
