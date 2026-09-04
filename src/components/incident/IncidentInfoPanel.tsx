import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';
import { useInteraction } from '../../pages/IncidentReconstructionPage';

const formatIso = (iso?: string) => {
  if (!iso) return '---';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
};

export const IncidentInfoPanel: React.FC = () => {
  const { spillId, spillDetails, backtrackData, loading, error } = useIncident();
  const { setDrawerContent } = useInteraction();

  if (loading) {
    return (
      <div className="bg-card/50 border border-border rounded p-3 shadow-sm flex flex-col items-center justify-center">
        <span className="animate-pulse text-muted-foreground font-sans text-xs">Loading incident...</span>
      </div>
    );
  }

  if (error || !spillDetails) {
    return (
      <div className="bg-card/50 border border-destructive/30 rounded p-3 shadow-sm flex flex-col items-center justify-center gap-2">
        <span className="text-destructive font-sans font-semibold text-xs">Incident Data Unavailable</span>
      </div>
    );
  }

  const area = spillDetails?.area_km2;
  const confidence = (spillDetails?.confidence_score ?? 0) * 100;
  
  const handleDetails = () => {
    setDrawerContent(
      <div className="space-y-4 text-sm">
        <p>Full incident details would load here via progressive disclosure.</p>
        <p className="text-muted-foreground">ID: {spillId}</p>
        <p className="text-muted-foreground">Status: Detected</p>
        <p className="text-muted-foreground">Detection Confidence: {confidence.toFixed(1)}%</p>
      </div>,
      "Incident Details"
    );
  };

  return (
    <div className="bg-card border border-border rounded overflow-hidden flex flex-col shadow-sm">
      <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500" />
          <h3 className="text-xs font-semibold text-foreground tracking-wider font-sans">INCIDENT</h3>
        </div>
        <button onClick={handleDetails} className="flex items-center text-[10px] text-primary hover:text-primary/80 transition-colors uppercase tracking-wider font-bold">
          Details <ChevronRight size={12} />
        </button>
      </div>
      
      <div className="p-3 grid grid-cols-2 gap-2">
        <div>
          <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5 font-sans">ID</span>
          <span className="text-foreground font-mono text-xs font-bold truncate block">{spillId}</span>
        </div>
        <div>
          <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5 font-sans">AREA</span>
          <span className="text-foreground font-mono text-xs">{area ? `${area.toFixed(2)} km²` : '---'}</span>
        </div>
      </div>
    </div>
  );
};
