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
        <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-sans">
          <Activity size={18} className="text-primary" />
          Surveillance Status
        </h3>
        <p className="text-xs text-muted-foreground font-semibold font-sans">
          Active satellite sensor coverage
        </p>
      </div>

      {/* Content Layout: 2 Columns */}
      <div className="flex-grow flex flex-row items-center justify-between gap-6 my-2">
        {/* Left: CSS Radar Sweep */}
        <div className="relative w-[130px] h-[130px] rounded-full border border-primary/30 bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
          {/* Concentric Grid Circles */}
          <div className="absolute w-[95px] h-[95px] rounded-full border border-dashed border-primary/20" />
          <div className="absolute w-[55px] h-[55px] rounded-full border border-dotted border-primary/20" />
          
          {/* Radar Grid Crosshairs */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-primary/20" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-primary/20" />

          {/* Sweeping Radar beam */}
          <div 
            className="absolute w-full h-full origin-center animate-[spin_4s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 0deg, transparent 50%, rgba(201, 100, 66, 0.12) 80%, rgba(201, 100, 66, 0.35) 100%)'
            }}
          />
          
          {/* Blinking scanning alert hotspots */}
          <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-destructive animate-ping" />
          <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-destructive" />
          
          <div className="absolute bottom-10 right-8 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          
          {/* Radar Sweep Center Indicator */}
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] z-10 animate-pulse" />
        </div>

        {/* Right: Satellites Feed */}
        <div className="flex-1 flex flex-col justify-center gap-2">
          {satellites.map((sat) => (
            <div 
              key={sat.name} 
              className="flex items-center justify-between text-[11px] font-extrabold font-mono border-b border-border/50 pb-1.5 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  sat.status === 'Active' || sat.status === 'Scanning' 
                    ? 'bg-primary animate-pulse' 
                    : 'bg-muted-foreground'
                }`} />
                <span className="text-foreground">{sat.name}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {sat.pass}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer System Status Link */}
      <div className="w-full flex items-center justify-between border-t border-border pt-3 text-[10px] text-primary font-bold font-mono">
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
