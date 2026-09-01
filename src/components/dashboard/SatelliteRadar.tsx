// src/components/dashboard/SatelliteRadar.tsx

import React from 'react';
import { Radio, ShieldCheck, Activity } from 'lucide-react';

export const SatelliteRadar: React.FC = () => {
  const satellites = [
    { name: 'Sentinel-1A', status: 'Active', pass: '12m ago' },
    { name: 'Landsat-8', status: 'Active', pass: '45m ago' },
    { name: 'Sentinel-2B', status: 'Scanning', pass: '3m ago' },
    { name: 'RADARSAT-2', status: 'Standby', pass: '2h ago' },
  ];

  return (
    <div className="flex flex-col h-full w-full justify-between relative select-none">
      {/* Header */}
      <div className="w-full text-left mb-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Activity size={18} className="text-[#0D9488] dark:text-[#00D9A6]" />
          Surveillance Status
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Active satellite sensor coverage
        </p>
      </div>

      {/* Content Layout: 2 Columns */}
      <div className="flex-grow flex flex-row items-center justify-between gap-6 my-2">
        {/* Left: CSS Radar Sweep */}
        <div className="relative w-[130px] h-[130px] rounded-full border border-[#0D9488]/30 dark:border-[#00D9A6]/20 bg-slate-50 dark:bg-[#1E2130]/50 flex items-center justify-center overflow-hidden shrink-0">
          {/* Concentric Grid Circles */}
          <div className="absolute w-[95px] h-[95px] rounded-full border border-dashed border-[#0D9488]/20 dark:border-[#00D9A6]/10" />
          <div className="absolute w-[55px] h-[55px] rounded-full border border-dotted border-[#0D9488]/20 dark:border-[#00D9A6]/10" />
          
          {/* Radar Grid Crosshairs */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#0D9488]/15 dark:bg-[#00D9A6]/10" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-[#0D9488]/15 dark:bg-[#00D9A6]/10" />

          {/* Sweeping Radar beam (conic gradient animated rotation) */}
          <div 
            className="absolute w-full h-full origin-center animate-[spin_4s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 0deg, transparent 50%, rgba(13, 148, 136, 0.12) 80%, rgba(13, 148, 136, 0.35) 100%)'
            }}
          />
          
          {/* Blinking scanning alert hotspots */}
          <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-red-500" />
          
          <div className="absolute bottom-10 right-8 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          
          {/* Radar Sweep Center Indicator */}
          <div className="w-2.5 h-2.5 rounded-full bg-[#0D9488] dark:bg-[#00D9A6] shadow-[0_0_8px_#0D9488] z-10 animate-pulse" />
        </div>

        {/* Right: Satellites Feed */}
        <div className="flex-1 flex flex-col justify-center gap-2">
          {satellites.map((sat) => (
            <div 
              key={sat.name} 
              className="flex items-center justify-between text-[11px] font-extrabold font-mono border-b border-slate-100 dark:border-[#252830]/40 pb-1.5 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  sat.status === 'Active' || sat.status === 'Scanning' 
                    ? 'bg-emerald-500 animate-pulse' 
                    : 'bg-amber-500'
                }`} />
                <span className="text-slate-800 dark:text-slate-200">{sat.name}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {sat.pass}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer System Status Link */}
      <div className="w-full flex items-center justify-between border-t border-slate-200 dark:border-[#252830]/50 pt-3 text-[10px] text-[#0D9488] dark:text-[#00D9A6] font-bold font-mono">
        <span className="flex items-center gap-1">
          <Radio size={12} className="animate-pulse" />
          COMS LINK STABLE
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} />
          HEALTH 99.8%
        </span>
      </div>
    </div>
  );
};
export default SatelliteRadar;
