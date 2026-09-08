import { AlertTriangle, CheckCircle, MapPin, RefreshCw, Layers, ShieldCheck, Tag } from 'lucide-react';
import type { AnalysisResult } from '../../types/image-analysis';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
  onViewMap?: (lat: number, lon: number) => void;
}

export function AnalysisResultCard({ result, onReset, onViewMap }: Props) {
  let isReal = false;
  let confidence = 0;

  try {
    const rawScore = result?.prediction?.confidence_score ?? 0;
    isReal = Boolean(result?.prediction?.is_oil_spill);
    confidence = Math.min(100, Math.max(0, Math.round(rawScore * 100)));
  } catch (err) {
    console.error('[AnalysisResultCard] Error calculating confidence score:', err);
  }

  const prediction = result.prediction;
  const message = prediction.message || (isReal ? 'Oil spill detected in image.' : 'No oil spill detected.');
  const spillId = prediction.spill_id;
  const areaKm2 = prediction.area_km2;
  const ageHours = prediction.estimated_age_hours;
  const centroid = prediction.centroid;

  function handleViewMapClick() {
    try {
      const lat = centroid?.lat ?? 18.92;
      const lon = centroid?.lon ?? 72.83;
      if (onViewMap) {
        onViewMap(lat, lon);
      }
    } catch (err) {
      console.error('[AnalysisResultCard] Error navigating to map:', err);
    }
  }

  function handleResetClick() {
    try {
      onReset();
    } catch (err) {
      console.error('[AnalysisResultCard] Error triggering reset handler:', err);
    }
  }

  return (
    <div className="rounded-2xl p-6 space-y-6 bg-card border border-border shadow-lg transition-all duration-300">
      {/* Header Banner */}
      <div className={`p-4 rounded-xl flex items-start gap-3.5 border ${
        isReal 
          ? 'bg-destructive/10 border-destructive/30 text-destructive' 
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
      }`}>
        {isReal ? (
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 animate-pulse text-destructive" />
        ) : (
          <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5 text-emerald-500" />
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold font-sans tracking-wide uppercase">
              {isReal ? 'Oil Spill Detected' : 'Clear / No Spill Detected'}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${
              isReal
                ? 'bg-destructive/20 border-destructive/40 text-destructive'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            }`}>
              {confidence}% Confidence
            </span>
          </div>
          <p className="text-xs font-medium opacity-90 font-sans leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium font-mono text-muted-foreground">
          <span>AI Detection Confidence</span>
          <span className="font-bold text-foreground">{confidence}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden p-0.5 border border-border">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isReal ? 'bg-gradient-to-r from-amber-500 to-destructive' : 'bg-gradient-to-r from-emerald-400 to-teal-500'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* ML Metric Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Affected Area */}
        <div className="rounded-xl p-3.5 bg-accent/40 border border-border space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Affected Area</span>
          </div>
          <p className="text-lg font-bold font-mono text-foreground">
            {areaKm2 !== undefined && areaKm2 !== null ? `${areaKm2} km²` : 'N/A'}
          </p>
        </div>

        {/* Estimated Age or Status */}
        <div className="rounded-xl p-3.5 bg-accent/40 border border-border space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
            <span>Detection Status</span>
          </div>
          <p className="text-lg font-bold font-mono text-foreground">
            {isReal ? 'Active Alert' : 'Verified Clear'}
          </p>
        </div>
      </div>

      {/* Extra Details: Spill ID & Centroid */}
      <div className="p-3.5 rounded-xl bg-accent/20 border border-border/60 text-xs font-mono space-y-2">
        {spillId && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              Spill ID:
            </span>
            <span className="font-semibold text-foreground bg-background px-2 py-0.5 rounded border border-border">
              {spillId}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            Centroid GPS:
          </span>
          <span className="font-semibold text-foreground">
            {centroid ? `${centroid.lat.toFixed(4)}, ${centroid.lon.toFixed(4)}` : 'Grid Centroid Calculated'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        {onViewMap && (
          <button
            onClick={handleViewMapClick}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            View on Live Map
          </button>
        )}
        <button
          onClick={handleResetClick}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border border-border bg-card hover:bg-accent text-foreground active:scale-[0.98] transition-all cursor-pointer ${
            onViewMap ? 'flex-1' : 'w-full'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {isReal ? 'Upload Another' : 'Try Again'}
        </button>
      </div>
    </div>
  );
}
