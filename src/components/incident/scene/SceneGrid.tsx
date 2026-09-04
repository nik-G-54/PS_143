import React from 'react';

export const SceneGrid: React.FC = () => {
  return (
    <gridHelper
      args={[600, 60, '#38bdf8', '#164e63']}
      position={[0, 0.02, 0]}
    />
  );
};
