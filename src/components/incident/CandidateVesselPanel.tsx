import React from 'react';
import { Ship, Info } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';

export const CandidateVesselPanel: React.FC = () => {
  const { vesselsData, loading, error, selectedVesselId, setSelectedVesselId } = useIncident();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm h-64 flex items-center justify-center">
        <span className="animate-pulse text-muted-foreground font-sans text-sm">Loading vessel correlation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm h-64 flex flex-col items-center justify-center gap-2">
        <span className="text-destructive text-sm">Vessel correlation unavailable.</span>
      </div>
    );
  }

  if (!vesselsData || !vesselsData.candidates || vesselsData.candidates.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm h-64 flex items-center justify-center">
        <span className="text-muted-foreground font-sans text-sm">No candidate vessels identified.</span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm max-h-96">
      <div className="bg-muted/40 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ship size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground tracking-wider font-sans">CANDIDATE VESSELS</h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{vesselsData.candidates.length} FOUND</span>
      </div>
      
      <div className="p-2 space-y-2 overflow-y-auto">
        {vesselsData.candidates.map((candidate) => {
          const isTopCandidate = candidate.rank === 1;
          const isSelected = selectedVesselId === candidate.vessel_id;

          return (
            <div 
              key={candidate.vessel_id}
              onClick={() => setSelectedVesselId(isSelected ? null : candidate.vessel_id)}
              className={`p-3 rounded-md border cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-primary/10 border-primary' 
                  : 'bg-muted/20 border-transparent hover:border-primary/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {candidate.vessel_name || candidate.vessel_id}
                    </span>
                    {isTopCandidate && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold tracking-wider">
                        TOP CANDIDATE
                      </span>
                    )}
                  </div>
                  {(candidate.imo || candidate.mmsi) && (
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {candidate.imo && `IMO: ${candidate.imo}`}
                      {candidate.imo && candidate.mmsi && ' • '}
                      {candidate.mmsi && `MMSI: ${candidate.mmsi}`}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-muted-foreground tracking-wider">RANK</span>
                  <span className="text-sm font-mono font-bold text-primary">#{candidate.rank ?? '?'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border/50">
                <div>
                  <span className="block text-[9px] text-muted-foreground tracking-wider">CORRELATION SCORE</span>
                  <span className="text-xs font-mono text-foreground">
                    {candidate.score !== null ? candidate.score.toFixed(3) : 'Unavailable'}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground tracking-wider">DIST. TO SOURCE EST.</span>
                  <span className="text-xs font-mono text-foreground">
                    {candidate.distance_to_origin_km !== undefined ? `${candidate.distance_to_origin_km.toFixed(2)} km` : '---'}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-border/50 flex items-start gap-2">
                  <Info size={12} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground">
                    This vessel is identified as a potential source through AIS correlation. This does not confirm causation.
                    {candidate.track ? ' Historical track data available.' : ' Detailed track data is pending backend support.'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};