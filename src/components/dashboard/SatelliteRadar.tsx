import React from 'react';
import { Activity } from 'lucide-react';
import RotatingEarth from '../ui/wireframe-dotted-globe';

export const SatelliteRadar: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full justify-between relative select-none">
      {/* Header */}
      <div className="w-full text-left mb-2">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-sans">
          <Activity size={18} className="text-primary" />
          Surveillance Status
        </h3>
        <p className="text-xs text-muted-foreground font-semibold font-sans">
          Active satellite sensor coverage
        </p>
      </div>

      {/* Main Body: Full-Width 3D Wireframe Dotted Globe */}
      <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden rounded-xl border border-border bg-card p-2 min-h-[180px]">
        <RotatingEarth width={220} height={220} className="w-full flex justify-center" />
      </div>
    </div>
  );
};
export default SatelliteRadar;
