import React from 'react';
import { Ship, ChevronRight } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';
import { useInteraction } from '../../context/InteractionContext';

export const CandidateVesselPanel: React.FC = () => {
  const { vesselsData, loading, error } = useIncident();
  const { setDrawerContent } = useInteraction();

  if (loading) {
    return (
      <div className="bg-card/50 border border-border rounded p-3 shadow-sm flex items-center justify-center">
        <span className="animate-pulse text-muted-foreground font-sans text-xs">Loading vessels...</span>
      </div>
    );
  }

  const vessels = vesselsData?.vessels || [];
  
  if (error || vessels.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded overflow-hidden flex flex-col shadow-sm">
        <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center gap-2">
          <Ship size={14} className="text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider font-sans">TOP CANDIDATE</h3>
        </div>
        <div className="p-3 flex items-center justify-center">
          <span className="text-muted-foreground font-sans text-xs">No candidate vessels available</span>
        </div>
      </div>
    );
  }

  // Find the top candidate by score
  const topCandidate = [...vessels].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

  const handleDetails = () => {
    setDrawerContent(
      <div className="space-y-4 text-sm">
        <p>Full vessel details via progressive disclosure.</p>
        <p className="text-muted-foreground">ID: {topCandidate.vessel_id}</p>
        <p className="text-muted-foreground">Name: {topCandidate.vessel_name}</p>
        <p className="text-muted-foreground">Match: {((topCandidate.score ?? 0) * 100).toFixed(1)}%</p>
        <p className="text-muted-foreground">Provenance: {topCandidate.is_mock ? 'DEMO / MOCK' : 'LIVE AIS'}</p>
        
        {/* Further details like track length, speeds, score breakdown can go here */}
      </div>,
      "Top Candidate Details"
    );
  };

  return (
    <div className="bg-card border border-border rounded overflow-hidden flex flex-col shadow-sm">
      <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ship size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground tracking-wider font-sans">TOP CANDIDATE</h3>
        </div>
        <button onClick={handleDetails} className="flex items-center text-[10px] text-primary hover:text-primary/80 transition-colors uppercase tracking-wider font-bold">
          Details <ChevronRight size={12} />
        </button>
      </div>
      
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-foreground font-mono text-sm font-bold truncate">
            {topCandidate.vessel_name || topCandidate.vessel_id}
          </span>
          {topCandidate.is_mock && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30 shrink-0">
              DEMO
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5">IMO / MMSI</span>
            <span className="font-mono text-foreground">
              {topCandidate.imo || '—'} / {topCandidate.mmsi || '—'}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5">MATCH</span>
            <span className="font-mono text-primary font-bold">
              {topCandidate.score != null ? `${(topCandidate.score * 100).toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          {topCandidate.distance_to_origin_km != null && (
            <div className="col-span-2">
              <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5">
                DIST. TO SOURCE
              </span>
              <span className="font-mono text-foreground">
                {topCandidate.distance_to_origin_km.toFixed(2)} km
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
