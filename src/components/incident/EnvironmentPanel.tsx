import React from 'react';
import { Wind, Waves, ChevronRight } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';
import { useInteraction } from '../../pages/IncidentReconstructionPage';

export const EnvironmentPanel: React.FC = () => {
  const { environment, loading, error } = useIncident();
  const { setDrawerContent } = useInteraction();

  if (loading) {
    return (
      <div className="bg-card/50 border border-border rounded p-3 shadow-sm flex items-center justify-center">
        <span className="animate-pulse text-muted-foreground font-sans text-xs">Loading environment...</span>
      </div>
    );
  }

  if (error || !environment) {
    return (
      <div className="bg-card/50 border border-border rounded overflow-hidden flex flex-col shadow-sm">
        <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center gap-2">
          <Wind size={14} className="text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider font-sans">ENVIRONMENT</h3>
        </div>
        <div className="p-3 flex items-center justify-center">
          <span className="text-muted-foreground font-sans text-xs">No environment data</span>
        </div>
      </div>
    );
  }

  const { wind, current } = environment;

  const handleDetails = () => {
    setDrawerContent(
      <div className="space-y-4 text-sm">
        <p>Full environment data details.</p>
        <p className="text-muted-foreground">Wind Speed: {wind.speed.toFixed(2)} m/s</p>
        <p className="text-muted-foreground">Wind Direction: {wind.direction.toFixed(1)}°</p>
        <p className="text-muted-foreground">Current Speed: {current.speed.toFixed(2)} m/s</p>
        <p className="text-muted-foreground">Current Direction: {current.direction.toFixed(1)}°</p>
      </div>,
      "Environment Details"
    );
  };

  return (
    <div className="bg-card border border-border rounded overflow-hidden flex flex-col shadow-sm">
      <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind size={14} className="text-blue-400" />
          <h3 className="text-xs font-semibold text-foreground tracking-wider font-sans">ENVIRONMENT</h3>
        </div>
        <button onClick={handleDetails} className="flex items-center text-[10px] text-primary hover:text-primary/80 transition-colors uppercase tracking-wider font-bold">
          Details <ChevronRight size={12} />
        </button>
      </div>
      
      <div className="p-3 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
            <Wind size={12} className="text-blue-400" />
          </div>
          <div>
            <span className="block text-muted-foreground text-[9px] tracking-wider font-sans">WIND</span>
            <span className="text-foreground font-mono text-xs">{wind.speed.toFixed(2)} m/s</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center shrink-0">
            <Waves size={12} className="text-teal-400" />
          </div>
          <div>
            <span className="block text-muted-foreground text-[9px] tracking-wider font-sans">CURRENT</span>
            <span className="text-foreground font-mono text-xs">{current.speed.toFixed(2)} m/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
