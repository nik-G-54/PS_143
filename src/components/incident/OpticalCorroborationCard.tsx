import React from 'react';
import { Eye, CheckCircle2, ShieldCheck, Sun, Layers } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';
import { useInteraction } from '../../pages/IncidentReconstructionPage';

export const OpticalCorroborationCard: React.FC = () => {
  const { spillDetails, loading, error } = useIncident();
  const { setDrawerContent } = useInteraction();

  if (loading) {
    return (
      <div className="bg-card/50 border border-border rounded-lg p-3 shadow-sm flex items-center justify-center">
        <span className="animate-pulse text-muted-foreground font-sans text-xs">Running Optical Check...</span>
      </div>
    );
  }

  if (error || !spillDetails) {
    return (
      <div className="bg-card/50 border border-border rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center gap-2">
          <Eye size={14} className="text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider font-sans">OPTICAL CHECK</h3>
        </div>
        <div className="p-3 flex items-center justify-center">
          <span className="text-muted-foreground font-sans text-xs">No optical corroboration data</span>
        </div>
      </div>
    );
  }

  const handleDetails = () => {
    setDrawerContent(
      <div className="space-y-4 text-sm font-mono">
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
          <h4 className="font-bold">Sentinel-2 Multispectral Corroboration Report</h4>
          <p className="text-xs">Status: VERIFIED OIL SLICK (No Look-Alike Anomaly)</p>
        </div>
        <p className="text-muted-foreground">Constellation: Sentinel-2B (MSI Multi-Spectral Instrument)</p>
        <p className="text-muted-foreground">Tile ID: S2B_MSIL2A_20260917_T34SGH</p>
        <p className="text-muted-foreground">SWIR Band (B11/B12): Hydrocarbon Absorption Dip Confirmed</p>
        <p className="text-muted-foreground">NDWI Surface Index: Water Surface Anomaly Matched</p>
        <p className="text-muted-foreground">Cloud Cover: 1.2% (Clear Line of Sight)</p>
        <p className="text-muted-foreground">Corroboration Index: 89.4%</p>
        <p className="text-muted-foreground">False Positive Filter: Passed (Biogenic Film & Low-Wind Calm Water Ruled Out)</p>
      </div>,
      "Sentinel-2 Optical Corroboration Details"
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm font-sans">
      <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-emerald-400" />
          <h3 className="text-xs font-semibold text-foreground tracking-wider uppercase">
            OPTICAL CHECK (SENTINEL-2)
          </h3>
        </div>
        <button onClick={handleDetails} className="flex items-center text-[10px] text-primary hover:text-primary/80 transition-colors uppercase tracking-wider font-bold">
          Details
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">STATUS</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 size={11} /> VERIFIED (89.4%)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Sun size={11} className="text-amber-400 shrink-0" />
            <span>Cloud Cover: <strong className="text-foreground">1.2%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
            <span>Look-Alike: <strong className="text-emerald-400">PASSED</strong></span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-border/60 text-[9px] font-mono text-muted-foreground flex items-center justify-between">
          <span className="truncate">Tile: S2B_MSIL2A_T34SGH</span>
          <span className="text-indigo-400 font-semibold">SWIR B11/B12 Hydrocarbon</span>
        </div>
      </div>
    </div>
  );
};
