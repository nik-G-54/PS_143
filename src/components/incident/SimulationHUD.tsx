import React from 'react';
import { mockIncident } from '../../data/mockIncident';
import { Crosshair } from 'lucide-react';

export const SimulationHUD: React.FC = () => {
  const { id, confidence, location } = mockIncident;

  return (
    <div className="absolute top-4 left-4 p-4 border border-primary/30 bg-card/80 backdrop-blur-md rounded pointer-events-none flex flex-col gap-3 min-w-[200px] shadow-md">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-xs text-muted-foreground font-mono tracking-widest">INCIDENT</span>
        <span className="text-primary font-mono font-bold">{id}</span>
      </div>
      
      <div>
        <div className="text-destructive text-sm font-bold flex items-center gap-2 mb-1 font-sans">
          <Crosshair size={14} />
          OIL SPILL DETECTED
        </div>
        <div className="flex justify-between text-xs mt-1 font-sans">
          <span className="text-muted-foreground">CONFIDENCE</span>
          <span className="text-foreground font-mono font-bold">{confidence}%</span>
        </div>
      </div>

      <div className="bg-muted/30 p-2 rounded border border-border mt-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground font-sans">LAT</span>
          <span className="text-foreground font-mono">{location.lat}° N</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground font-sans">LON</span>
          <span className="text-foreground font-mono">{location.lng}° E</span>
        </div>
        <div className="flex justify-between text-xs mt-2 pt-1 border-t border-border">
          <span className="text-muted-foreground font-sans">REGION</span>
          <span className="text-foreground font-semibold font-sans">{location.name.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
