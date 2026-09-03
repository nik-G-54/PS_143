import { CheckCircle, XCircle, MapPin, RefreshCw } from 'lucide-react';
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

  function handleViewMapClick() {
    try {
      const lat = result?.prediction?.centroid?.lat;
      const lon = result?.prediction?.centroid?.lon;
      if (lat !== undefined && lon !== undefined && onViewMap) {
        onViewMap(lat, lon);
      } else {
        console.warn('[AnalysisResultCard] Centroid lat/lon coordinates unavailable:', result?.prediction?.centroid);
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
    <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: 'var(--card)' }}>
      {/* Verdict */}
      <div className="flex items-center gap-3">
        {isReal ? (
          <CheckCircle className="w-6 h-6" style={{ color: 'var(--brand)' }} />
        ) : (
          <XCircle className="w-6 h-6" style={{ color: 'var(--alert)' }} />
        )}
        <div>
          <h3 className="text-base font-semibold font-[var(--font-sans)] text-[var(--fg)]">
            {isReal ? 'OIL SPILL DETECTED' : 'NO OIL SPILL DETECTED'}
          </h3>
          <p className="text-xs text-[var(--fg)]/50 font-[var(--font-mono)]">
            Confidence: {confidence}%
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="w-full h-2 rounded-full bg-[var(--fg)]/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${confidence}%`,
            backgroundColor: isReal ? 'var(--brand)' : 'var(--alert)',
          }}
        />
      </div>

      {/* Real spill details */}
      {isReal && (
        <div className="grid grid-cols-2 gap-3">
          {result.prediction.area_km2 !== undefined && (
            <div className="rounded-lg p-3 bg-[var(--bg)]">
              <p className="text-xs text-[var(--fg)]/50 font-[var(--font-sans)]">Area</p>
              <p className="text-lg font-semibold font-[var(--font-mono)] text-[var(--fg)]">
                {result.prediction.area_km2} km²
              </p>
            </div>
          )}
          {result.prediction.estimated_age_hours !== undefined && (
            <div className="rounded-lg p-3 bg-[var(--bg)]">
              <p className="text-xs text-[var(--fg)]/50 font-[var(--font-sans)]">Age</p>
              <p className="text-lg font-semibold font-[var(--font-mono)] text-[var(--fg)]">
                {Number(result.prediction.estimated_age_hours).toFixed(1)}h
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isReal && result.prediction.centroid && onViewMap && (
          <button
            onClick={handleViewMapClick}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white font-[var(--font-sans)] cursor-pointer"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <MapPin className="w-4 h-4" />
            View on Map
          </button>
        )}
        <button
          onClick={handleResetClick}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold font-[var(--font-sans)] border cursor-pointer ${isReal ? 'flex-1' : 'w-full'}`}
          style={{ borderColor: 'var(--fg)', color: 'var(--fg)' }}
        >
          <RefreshCw className="w-4 h-4" />
          {isReal ? 'Upload Another' : 'Try Again'}
        </button>
      </div>
    </div>
  );
}
