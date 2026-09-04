import React from 'react';

export const SceneGrid: React.FC = () => {
  return (
    <gridHelper 
      args={[600, 60, '#0a1825', '#060e18']} // Very dark, nearly invisible grid
      position={[0, -0.12, 0]} // Slightly below ocean surface
    />
  );
};
