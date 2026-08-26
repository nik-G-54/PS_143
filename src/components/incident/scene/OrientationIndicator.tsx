import React from 'react';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';

export const OrientationIndicator: React.FC = () => {
  return (
    <GizmoHelper
      alignment="bottom-left"
      margin={[40, 40]}
    >
      <GizmoViewport 
        axisColors={['#ef4444', '#10b981', '#3b82f6']} // RGB
        labelColor="white"
        labels={['E', 'Up', 'S']} // +X is East, +Y is Up, +Z is South
      />
    </GizmoHelper>
  );
};
