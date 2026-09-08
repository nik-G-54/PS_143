// src/components/map/SpillDetailPanel.tsx
import type { SpillEvent } from '../../types/spill';

interface SpillDetailPanelProps {
  spill: SpillEvent;
  onClose: () => void;
}

export function SpillDetailPanel({ spill, onClose }: SpillDetailPanelProps) {
  const confPercent = (spill.confidence_score * 100).toFixed(0);

  return (
    <div className="absolute top-4 right-20 bottom-24 w-80 z-20 animate-slide-in">
      <div className="h-full bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col">
        {/* Header with Image */}
        <div className="relative h-40">
          <img src={spill.image_url} alt="Satellite view" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent" />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition"
          >
            ✕
          </button>
          {/* ID Badge */}
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-mono text-cyan-400">
            {spill.spill_id}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Confidence Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Confidence</span>
              <span
                className={`text-sm font-bold ${
                  spill.confidence_score >= 0.8
                    ? 'text-red-400'
                    : spill.confidence_score >= 0.6
                    ? 'text-amber-400'
                    : 'text-yellow-400'
                }`}
              >
                {confPercent}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  spill.confidence_score >= 0.8
                    ? 'bg-gradient-to-r from-red-600 to-red-400'
                    : spill.confidence_score >= 0.6
                    ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                }`}
                style={{ width: `${confPercent}%` }}
              />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <InfoCard label="Area" value={`${spill.area_km2}`} unit="km²" />
            <InfoCard label="Candidates" value={spill.candidate_count} />
            <InfoCard
              label="Detected"
              value={new Date(spill.detected_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short'
              })}
            />
            <InfoCard
              label="Coordinates"
              value={`${spill.centroid.lat.toFixed(3)}°`}
              small={`${spill.centroid.lon.toFixed(3)}°`}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
              <span>▶</span>
              <span>Run Attribution</span>
            </button>
            <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-all">
              View Full Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  unit,
  small
}: {
  label: string;
  value: string | number;
  unit?: string;
  small?: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-semibold text-white">
        {value} {unit && <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>}
      </div>
      {small && <div className="text-xs text-slate-400">{small}</div>}
    </div>
  );
}
