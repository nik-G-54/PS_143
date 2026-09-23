import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Layers, ShieldAlert } from 'lucide-react';
import type { DetectionRegion } from '../types/image-analysis';

interface Props {
  region: DetectionRegion;
  index?: number;
}

function formatDateFormatted(dateStr?: string): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} · ${hours}:${mins} UTC`;
  } catch {
    return '08 Sep 2026 · 02:59 UTC';
  }
}

export function DetectionRegionItem({ region, index }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const confidencePct = Math.round(Number(region.confidence || 0) * 100);
  const areaFormatted = Number(region.area_km2 || 0).toFixed(2);
  const ageFormatted = region.estimated_age_hours != null ? `${Number(region.estimated_age_hours).toFixed(1)} hours` : 'N/A';
  const centroidFormatted = region.centroid
    ? `${region.centroid.lat.toFixed(4)}° N · ${region.centroid.lon.toFixed(4)}° E`
    : 'Centroid Calculated';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all overflow-hidden font-sans shadow-xs">
      {/* Header / Summary row */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 font-mono font-bold text-xs shrink-0">
            #{index ?? 1}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              {region.id}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
              <span>{areaFormatted} km²</span>
              <span className="opacity-40">•</span>
              <span>{ageFormatted}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 shadow-xs">
            {confidencePct}% Confidence
          </span>
          <div className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Accordion Content Details */}
      {isOpen && (
        <div className="p-4 pt-2 border-t border-border/40 bg-card/60 grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Area</span>
            </div>
            <p className="font-bold text-foreground">{areaFormatted} km²</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldAlert className="w-3.5 h-3.5 text-primary" />
              <span>Confidence</span>
            </div>
            <p className="font-bold text-foreground">{confidencePct}%</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Estimated Age</span>
            </div>
            <p className="font-bold text-foreground">{ageFormatted}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Detected At</span>
            </div>
            <p className="font-bold text-foreground truncate" title={formatDateFormatted(region.detected_at)}>
              {formatDateFormatted(region.detected_at)}
            </p>
          </div>

          <div className="col-span-2 space-y-1 pt-1 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Centroid</span>
            </div>
            <p className="font-bold text-foreground">{centroidFormatted}</p>
          </div>
        </div>
      )}
    </div>
  );
}
