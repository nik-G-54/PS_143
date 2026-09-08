import { AlertTriangle, CheckCircle, RefreshCw, FileText, Layers, Clock, ShieldCheck } from 'lucide-react';
import type { AnalysisResult as ResultType } from '../types/image-analysis';
import { DetectionRegionList } from './DetectionRegionList';

interface Props {
  result: ResultType;
  onReset: () => void;
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

export function AnalysisResult({ result, onReset }: Props) {
  const prediction = result.prediction;
  const isReal = prediction.is_oil_spill;
  const peakConfidence = Math.min(100, Math.max(0, Math.round((prediction.peak_confidence || 0) * 100)));
  const totalSpills = prediction.total_spills || prediction.detections.length || (isReal ? 1 : 0);
  const totalArea = prediction.total_area_km2 || 0;
  const ageRange = prediction.age_range;

  let ageRangeFormatted = '';
  if (ageRange && ageRange.min !== undefined && ageRange.max !== undefined) {
    if (Math.round(ageRange.min) === Math.round(ageRange.max)) {
      ageRangeFormatted = `${Math.round(ageRange.min)} h`;
    } else {
      ageRangeFormatted = `${Math.round(ageRange.min)}–${Math.round(ageRange.max)} h`;
    }
  }

  // Truncate long filename cleanly
  const fileName = result.file_name || 'SAR-Satellite-Image.jpg';
  const truncatedFileName = fileName.length > 38 ? `${fileName.substring(0, 35)}...` : fileName;

  return (
    <div className="rounded-2xl p-6 bg-card border border-border shadow-lg space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-mono font-bold text-muted-foreground tracking-wider uppercase">
            ANALYSIS RESULT
          </h2>
          <p className="text-xs text-muted-foreground font-sans">
            Verified AI detection output for SAR image
          </p>
        </div>
      </div>

      {/* Primary Outcome Banner */}
      <div className={`p-4 rounded-xl flex items-start gap-4 border ${
        isReal
          ? 'bg-destructive/10 border-destructive/30 text-destructive'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
      }`}>
        {isReal ? (
          <AlertTriangle className="w-7 h-7 shrink-0 mt-0.5 animate-pulse text-destructive" />
        ) : (
          <ShieldCheck className="w-7 h-7 shrink-0 mt-0.5 text-emerald-500" />
        )}

        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold font-sans tracking-tight uppercase">
                {isReal ? 'OIL SPILL DETECTED' : 'NO OIL SPILL DETECTED'}
              </h3>
              <p className="text-xs font-mono opacity-80">
                {isReal
                  ? `${totalSpills} spill region${totalSpills > 1 ? 's' : ''} identified`
                  : 'The model did not identify a significant oil-spill signature'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-2xl font-bold font-mono leading-none block">
                {peakConfidence}%
              </span>
              <span className="text-[10px] font-mono font-semibold tracking-wider uppercase opacity-70">
                {isReal ? 'PEAK CONFIDENCE' : 'CONFIDENCE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded SAR Image Preview */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-border/80 group">
        <img
          src={result.image_url}
          alt={fileName}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Positive Outcome Summary Metrics */}
      {isReal && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono">
          <div className="rounded-xl p-3.5 bg-accent/40 border border-border/60 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-sans">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>REGIONS</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalSpills}</p>
          </div>

          <div className="rounded-xl p-3.5 bg-accent/40 border border-border/60 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-sans">
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
              <span>TOTAL AREA</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalArea.toFixed(2)} km²</p>
          </div>

          {ageRangeFormatted && (
            <div className="col-span-2 md:col-span-1 rounded-xl p-3.5 bg-accent/40 border border-border/60 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-sans">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>AGE RANGE</span>
              </div>
              <p className="text-xl font-bold text-foreground">{ageRangeFormatted}</p>
            </div>
          )}
        </div>
      )}

      {/* Detected Regions Expandable List */}
      {isReal && prediction.detections && prediction.detections.length > 0 && (
        <DetectionRegionList regions={prediction.detections} />
      )}

      {/* Source Image & Timestamp Metadata Footer */}
      <div className="p-3.5 rounded-xl bg-accent/20 border border-border/60 text-xs font-mono flex items-center justify-between text-muted-foreground">
        <div className="flex items-center gap-2 truncate max-w-[65%]" title={fileName}>
          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">Source: {truncatedFileName}</span>
        </div>
        <div className="shrink-0 font-semibold text-foreground">
          {formatDateFormatted(result.analyzed_at)}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          onClick={onReset}
          className="w-full py-3.5 px-6 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Analyze Another Image</span>
        </button>
      </div>
    </div>
  );
}
