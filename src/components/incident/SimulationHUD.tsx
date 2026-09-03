import React from 'react';
import { useIncident } from '../../context/IncidentContext';
import { Crosshair } from 'lucide-react';

export const SimulationHUD: React.FC = () => {
  const { spillDetails, backtrackData, dataSources } = useIncident();

  if (!spillDetails) return null;

  const lat = backtrackData?.backtrack.observation.latitude ?? spillDetails.centroid?.latitude ?? spillDetails.centroid?.lat ?? 0;
  const lng = backtrackData?.backtrack.observation.longitude ?? spillDetails.centroid?.longitude ?? spillDetails.centroid?.lon ?? 0;
  const name = spillDetails.location_name || 'MEDITERRANEAN SEA';
  const confidence = (spillDetails.confidence_score ?? 0) * 100;
  const id = spillDetails.spill_id ?? 'UNKNOWN';

  return (
    <div className="absolute top-4 left-4 p-4 border border-primary/30 bg-card/80 backdrop-blur-md rounded pointer-events-none flex flex-col gap-3 min-w-[200px] shadow-md z-10">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-xs text-muted-foreground font-mono tracking-widest">INCIDENT</span>
        <span className="text-primary font-mono font-bold">{id}</span>
      </div>
      
      {dataSources && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono">TRAJECTORY</span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            dataSources.trajectory === 'Simulated Demo' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-primary/20 text-primary border-primary/30'
          }`}>
            {dataSources.trajectory.toUpperCase()}
          </span>
        </div>
      )}
      
      <div>
        <div className="text-destructive text-sm font-bold flex items-center gap-2 mb-1 font-sans">
          <Crosshair size={14} />
          OIL SPILL DETECTED
        </div>
        <div className="flex justify-between text-xs mt-1 font-sans">
          <span className="text-muted-foreground">CONFIDENCE</span>
          <span className="text-foreground font-mono font-bold">{confidence.toFixed(0)}%</span>
        </div>
      </div>

      <div className="bg-muted/30 p-2 rounded border border-border mt-1">
        <div className="text-[10px] text-muted-foreground font-mono tracking-widest mb-1 border-b border-border/50 pb-1">GEOGRAPHIC CONTEXT</div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground font-sans">REGION</span>
          <span className="text-foreground font-semibold font-sans">{name.toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-xs mb-1 mt-2">
          <span className="text-muted-foreground font-sans">LAT</span>
          <span className="text-foreground font-mono">{lat.toFixed(4)}° {lat >= 0 ? 'N' : 'S'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground font-sans">LON</span>
          <span className="text-foreground font-mono">{lng.toFixed(4)}° {lng >= 0 ? 'E' : 'W'}</span>
        </div>
      </div>
    </div>
  );
};
