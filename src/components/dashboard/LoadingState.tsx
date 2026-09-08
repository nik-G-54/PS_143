// src/components/dashboard/LoadingState.tsx

import React from 'react';
import { UniversalLoader } from '../ui/UniversalLoader';

export const LoadingState: React.FC = () => {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center">
      <UniversalLoader
        message="Loading Maritime Incident Analytics..."
        submessage="Processing satellite detections, coverage area calculations, and candidate vessel tracking"
      />
    </div>
  );
};
