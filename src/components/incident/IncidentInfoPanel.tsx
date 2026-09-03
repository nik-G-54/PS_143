import React from 'react';
import { AlertCircle, Ship, Navigation } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';

// Helper to format ISO
const formatIso = (iso?: string) => {
  if (!iso) return '---';
  const d = new Date(iso);
  return `${d.toISOString().split('T')[0]} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
};

export const IncidentInfoPanel: React.FC = () => {
  const { spillId, backtrackData, dataSources, loading, error } = useIncident();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm h-64 flex items-center justify-center">
        <span className="animate-pulse text-muted-foreground font-sans">Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-destructive/50 rounded-lg p-4 shadow-sm h-64 flex flex-col items-center justify-center gap-2">
        <AlertCircle size={24} className="text-destructive" />
        <span className="text-destructive font-sans font-semibold">Incident Data Unavailable</span>
        <span className="text-muted-foreground text-xs font-sans text-center">{error}</span>
      </div>
    );
  }

  const obsLat = backtrackData?.backtrack.observation.latitude;
  const obsLng = backtrackData?.backtrack.observation.longitude;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm">
      <div className="bg-muted/40 px-4 py-3 border-b border-border flex items-center gap-2">
        <AlertCircle size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground tracking-wider font-sans">SPILL DETAILS</h3>
      </div>
      
      <div className="p-4 space-y-4 text-sm flex-1 overflow-y-auto">
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground font-medium text-xs tracking-wider font-sans">SPILL ID</span>
          <span className="text-primary font-mono font-bold">{spillId}</span>
        </div>
        
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground font-medium text-xs tracking-wider font-sans">OBSERVATION TIME</span>
          <span className="text-foreground font-mono text-xs">{formatIso(backtrackData?.backtrack.observation.timestamp)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-border pb-2">
          <div>
            <span className="block text-muted-foreground text-[10px] tracking-wider mb-1 font-sans">OBSERVED LAT</span>
            <span className="text-foreground font-mono text-xs bg-muted/50 px-2 py-1 rounded">
              {obsLat !== undefined ? `${obsLat.toFixed(4)}° ${obsLat >= 0 ? 'N' : 'S'}` : '---'}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground text-[10px] tracking-wider mb-1 font-sans">OBSERVED LON</span>
            <span className="text-foreground font-mono text-xs bg-muted/50 px-2 py-1 rounded">
              {obsLng !== undefined ? `${obsLng.toFixed(4)}° ${obsLng >= 0 ? 'E' : 'W'}` : '---'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Navigation size={14} className="text-primary" />
            <span className="text-muted-foreground font-semibold text-xs tracking-wider font-sans">SOURCE ESTIMATE</span>
          </div>
          <div className="bg-muted/30 p-3 rounded border border-border space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-[10px] font-sans">EST. RELEASE</span>
              <span className="text-foreground font-mono text-xs">{formatIso(backtrackData?.backtrack.estimated_release_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-[10px] font-sans">LATITUDE</span>
              <span className="text-foreground font-mono text-xs">{backtrackData?.backtrack.source_estimate.latitude ?? '---'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-[10px] font-sans">LONGITUDE</span>
              <span className="text-foreground font-mono text-xs">{backtrackData?.backtrack.source_estimate.longitude ?? '---'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-[10px] font-sans">RADIUS</span>
              <span className="text-primary font-mono text-xs">{backtrackData?.backtrack.source_estimate.radius_km ? `${backtrackData.backtrack.source_estimate.radius_km.toFixed(2)} km` : '---'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/50">
              <span className="text-muted-foreground text-[9px] font-sans">DATA SOURCE</span>
              <span className="text-muted-foreground font-mono text-[9px]">{dataSources?.sourceEstimate.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Ship size={14} className="text-primary" />
            <span className="text-muted-foreground font-semibold text-xs tracking-wider font-sans">ATTRIBUTION</span>
          </div>
          <div className="bg-muted/30 p-3 rounded border border-border space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-[10px] font-sans">CANDIDATES</span>
              <span className="text-foreground font-medium text-xs font-sans">{backtrackData?.attribution.candidate_count ?? '---'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-[10px] font-sans">TOP VESSEL</span>
              <span className="text-primary font-mono text-xs">{backtrackData?.attribution.top_vessel ?? '---'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/50">
              <span className="text-muted-foreground text-[9px] font-sans">DATA SOURCE</span>
              <span className="text-muted-foreground font-mono text-[9px]">{dataSources?.vessels.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
