import React from 'react';
import { AlertCircle, ChevronRight, MapPin, Clock } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';
import { useInteraction } from '../../pages/IncidentReconstructionPage';

const formatDetected = (iso?: string) => {
  if (!iso) return '---';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '---';
  return `${d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
};

export const IncidentInfoPanel: React.FC = () => {
  const { spillId, spillDetails, backtrackData, loading, error } = useIncident();
  const { setDrawerContent } = useInteraction();

  if (loading) {
    return (
      <div className="bg-card/50 border border-border rounded-lg p-3 shadow-sm flex flex-col items-center justify-center">
        <span className="animate-pulse text-muted-foreground font-sans text-xs">Loading incident...</span>
      </div>
    );
  }

  if (error || !spillDetails) {
    return (
      <div className="bg-card/50 border border-destructive/30 rounded-lg p-3 shadow-sm flex flex-col items-center justify-center gap-2">
        <span className="text-destructive font-sans font-semibold text-xs">Incident Data Unavailable</span>
      </div>
    );
  }

  const area = spillDetails?.area_km2;
  const rawConf = spillDetails?.confidence_score ?? 0;
  const confidence = rawConf <= 1 ? rawConf * 100 : rawConf;
  const lat =
    backtrackData?.backtrack.observation.latitude ??
    spillDetails.centroid?.latitude ??
    spillDetails.centroid?.lat;
  const lng =
    backtrackData?.backtrack.observation.longitude ??
    spillDetails.centroid?.longitude ??
    spillDetails.centroid?.lon;
  const detectedAt =
    backtrackData?.backtrack.observation.timestamp ?? spillDetails.detected_at;
  const priority = confidence >= 85 ? 'HIGH' : confidence >= 70 ? 'MEDIUM' : 'LOW';

  const handleDetails = () => {
    setDrawerContent(
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">ID: {spillId}</p>
        <p className="text-muted-foreground">Detected: {formatDetected(detectedAt)}</p>
        <p className="text-muted-foreground">
          Location:{' '}
          {lat != null && lng != null
            ? `${Number(lat).toFixed(4)}°, ${Number(lng).toFixed(4)}°`
            : '—'}
        </p>
        <p className="text-muted-foreground">
          Area: {typeof area === 'number' ? `${area.toFixed(2)} km²` : '—'}
        </p>
        <p className="text-muted-foreground">Confidence: {confidence.toFixed(1)}%</p>
        <p className="text-muted-foreground">Priority: {priority}</p>
      </div>,
      'Incident Details'
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm">
      <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500" />
          <h3 className="text-xs font-semibold text-foreground tracking-wider font-sans">
            INCIDENT OVERVIEW
          </h3>
        </div>
        <button
          onClick={handleDetails}
          className="flex items-center text-[10px] text-primary hover:text-primary/80 transition-colors uppercase tracking-wider font-bold"
        >
          Details <ChevronRight size={12} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5 font-sans">
              ID
            </span>
            <span className="text-foreground font-mono text-xs font-bold truncate block">
              {spillId}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5 font-sans">
              PRIORITY
            </span>
            <span
              className={`font-mono text-xs font-bold ${
                priority === 'HIGH'
                  ? 'text-red-400'
                  : priority === 'MEDIUM'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}
            >
              {priority}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs">
          <Clock size={12} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5">
              DETECTED
            </span>
            <span className="font-mono text-[11px] text-foreground">{formatDetected(detectedAt)}</span>
          </div>
        </div>

        {lat != null && lng != null && (
          <div className="flex items-start gap-2 text-xs">
            <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5">
                LOCATION
              </span>
              <span className="font-mono text-[11px] text-foreground">
                {Number(lat).toFixed(3)}° {Number(lat) >= 0 ? 'N' : 'S'},{' '}
                {Number(lng).toFixed(3)}° {Number(lng) >= 0 ? 'E' : 'W'}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
          <div>
            <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5 font-sans">
              SPILL AREA
            </span>
            <span className="text-orange-300 font-mono text-xs">
              {typeof area === 'number' ? `${area.toFixed(2)} km²` : '---'}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground text-[9px] tracking-wider mb-0.5 font-sans">
              CONFIDENCE
            </span>
            <span className="text-emerald-400 font-mono text-xs">{confidence.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
