import React from 'react';

export const SceneGrid: React.FC = () => {
  return (
    <gridHelper 
      args={[1000, 100, '#b05730', '#3e3e38']} // Claude Amber rust center, warm grid lines
      position={[0, -0.1, 0]} 
    />
  );
};
