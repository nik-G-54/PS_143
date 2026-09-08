import React from 'react';
import { Navigation, ChevronRight } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';
import { useInteraction } from '../../pages/IncidentReconstructionPage';

export const SourceEstimateCard: React.FC = () => {
  const { backtrackData, loading, error } = useIncident();
  const { setDrawerContent } = useInteraction();

  if (loading) {
    return (
      <div className="bg-card/50 border border-border rounded p-3 shadow-sm flex items-center justify-center">
        <span className="animate-pulse text-muted-foreground font-sans text-xs">Loading source...</span>
      </div>
    );
  }

  const sourceEst = backtrackData?.backtrack.source_estimate;

  if (error || !sourceEst || sourceEst.latitude === undefined || sourceEst.longitude === undefined) {
    return (
      <div className="bg-card/50 border border-border rounded overflow-hidden flex flex-col shadow-sm">
        <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center gap-2">
          <Navigation size={14} className="text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider font-sans">SOURCE</h3>
        </div>
        <div className="p-3 flex items-center justify-center">
          <span className="text-muted-foreground font-sans text-xs">Not run / Unavailable</span>
        </div>
      </div>
    );
  }

  const handleDetails = () => {
    setDrawerContent(
      <div className="space-y-4 text-sm">
        <p>Full source estimate details.</p>
        <p className="text-muted-foreground">Lat: {sourceEst.latitude.toFixed(4)}°</p>
        <p className="text-muted-foreground">Lon: {sourceEst.longitude.toFixed(4)}°</p>
        <p className="text-muted-foreground">Radius: {sourceEst.radius_km} km</p>
      </div>,
      "Source Estimate Details"
    );
  };

  return (
    <div className="bg-card border border-border rounded overflow-hidden flex flex-col shadow-sm">
      <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation size={14} className="text-amber-500" />
          <h3 className="text-xs font-semibold text-foreground tracking-wider font-sans">SOURCE</h3>
        </div>
        <button onClick={handleDetails} className="flex items-center text-[10px] text-primary hover:text-primary/80 transition-colors uppercase tracking-wider font-bold">
          Details <ChevronRight size={12} />
        </button>
      </div>
      
      <div className="p-3 grid grid-cols-2 gap-2">
        <div>
          <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5 font-sans">LATITUDE</span>
          <span className="text-foreground font-mono text-xs font-bold">
            {sourceEst.latitude.toFixed(4)}° {sourceEst.latitude >= 0 ? 'N' : 'S'}
          </span>
        </div>
        <div>
          <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5 font-sans">LONGITUDE</span>
          <span className="text-foreground font-mono text-xs font-bold">
            {sourceEst.longitude.toFixed(4)}° {sourceEst.longitude >= 0 ? 'E' : 'W'}
          </span>
        </div>
      </div>
    </div>
  );
};
