import React from 'react';
import { useIncident } from '../../context/IncidentContext';
import { useSimulation } from '../../context/SimulationContext';

export const SimulationHUD: React.FC = () => {
  const { spillDetails, backtrackData, dataSources } = useIncident();
  const { progress } = useSimulation();

  if (!spillDetails) return null;

  const lat = backtrackData?.backtrack.observation.latitude ?? spillDetails.centroid?.latitude ?? spillDetails.centroid?.lat ?? 0;
  const lng = backtrackData?.backtrack.observation.longitude ?? spillDetails.centroid?.longitude ?? spillDetails.centroid?.lon ?? 0;
  const id = spillDetails.spill_id ?? 'UNKNOWN';

  // Compute Current Simulation Time
  let simTimeStr = '---';
  if (backtrackData?.backtrack) {
    const startMs = Date.parse(backtrackData.backtrack.estimated_release_time);
    const endMs = Date.parse(backtrackData.backtrack.observation.timestamp);
    if (!isNaN(startMs) && !isNaN(endMs)) {
      const currentMs = startMs + (endMs - startMs) * progress;
      const d = new Date(currentMs);
      simTimeStr = `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
    }
  }

  return (
    <div className="absolute top-4 left-4 p-3 border border-primary/20 bg-card/60 backdrop-blur-md rounded flex flex-col gap-2 min-w-[170px] pointer-events-none shadow-sm z-10">
      <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
        <span className="text-[9px] text-muted-foreground font-mono tracking-widest">INCIDENT</span>
        <span className="text-primary font-mono text-xs font-bold">{id}</span>
      </div>
      
      {dataSources && (
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground font-mono">TRAJECTORY</span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            dataSources.trajectory === 'Simulated Demo' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-primary/20 text-primary border-primary/30'
          }`}>
            {dataSources.trajectory.toUpperCase()}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground font-sans">TIME</span>
          <span className="text-foreground font-mono text-xs text-primary">{simTimeStr}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground font-sans">LAT</span>
          <span className="text-foreground font-mono">{lat.toFixed(4)}° {lat >= 0 ? 'N' : 'S'}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground font-sans">LON</span>
          <span className="text-foreground font-mono">{lng.toFixed(4)}° {lng >= 0 ? 'E' : 'W'}</span>
        </div>
      </div>
    </div>
  );
};
