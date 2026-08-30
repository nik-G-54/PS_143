import { X, MapPin, Target, Anchor, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SlideInPanelProps {
  spill: any;
  attribution: any;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export function SlideInPanel({ spill, attribution, onClose, theme }: SlideInPanelProps) {
  const isOpen = !!spill;
  const cardBg = theme === 'dark' ? 'bg-[#151F33] border-[#64748B]/30' : 'bg-white border-[#E5E7EB]';
  const borderBg = theme === 'dark' ? 'border-[#64748B]/30' : 'border-[#E5E7EB]';
  const textHeading = theme === 'dark' ? 'text-[#F8FAFC]' : 'text-[#1A1D23]';
  const textBody = theme === 'dark' ? 'text-[#94A3B8]' : 'text-[#4B5563]';
  const textPrimary = theme === 'dark' ? 'text-[#0EA5E9]' : 'text-[#00B894]';
  const bgPrimary = theme === 'dark' ? 'bg-[#0EA5E9]' : 'bg-[#00B894]';
  const hoverBg = theme === 'dark' ? 'hover:bg-[#1F2E4A]' : 'hover:bg-[#F3F4F6]';
  const boxBg = theme === 'dark' ? 'bg-[#090D16]/50' : 'bg-[#F9FAFB]';

  const topVessel = attribution?.ranked_vessels?.[0];

  return (
    <div
      className={`fixed top-16 right-0 bottom-0 w-96 z-30 ${cardBg} border-l shadow-2xl
                  transform transition-transform duration-300 ease-in-out flex flex-col
                  ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Header */}
      <div className={`p-5 border-b ${borderBg} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className={`font-mono font-bold ${textPrimary}`}>{spill?.spill_id}</h3>
            <p className="text-xs text-[#64748B] uppercase tracking-wide">{spill?.status}</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${hoverBg} transition`}
          title="Close panel"
        >
          <X size={18} className="text-[#94A3B8]" />
        </button>
      </div>

      {/* Content Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto">
        {/* Spill Details */}
        <div className="p-5 space-y-4">
          <InfoRow 
            icon={<MapPin size={16} />} 
            label="Location"
            value={spill?.centroid ? `${spill.centroid.latitude.toFixed(4)}°N, ${spill.centroid.longitude.toFixed(4)}°E` : ''} 
            theme={theme}
          />
          <InfoRow 
            icon={<Target size={16} />} 
            label="Confidence"
            value={spill?.detection_confidence ? `${(spill.detection_confidence * 100).toFixed(1)}%` : ''} 
            theme={theme}
          />
          <InfoRow 
            icon={<Anchor size={16} />} 
            label="Source"
            value={spill?.source_dataset || ''} 
            theme={theme}
          />
        </div>

        {/* Attribution Result */}
        {topVessel && (
          <div className={`p-5 border-t ${borderBg}`}>
            <h4 className="text-xs uppercase tracking-wide text-[#9CA3AF] font-semibold mb-3">
              Top Suspect Vessel
            </h4>
            <div className={`${boxBg} rounded-xl p-4 border ${borderBg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`font-mono font-bold ${textPrimary}`}>{topVessel.vessel_id}</span>
                <span className={`text-2xl font-bold ${textHeading}`}>{(topVessel.score * 100).toFixed(1)}%</span>
              </div>
              <div className={`text-xs ${textBody} mb-3`}>{topVessel.vessel_type}</div>

              {/* Score breakdown */}
              <div className="space-y-2">
                <ScoreBar label="Proximity" value={topVessel.approach_score} theme={theme} />
                <ScoreBar label="Speed Pattern" value={topVessel.slowdown_ratio ?? topVessel.departure_score ?? 0.8} theme={theme} />
                <ScoreBar label="Loitering" value={Math.min(topVessel.loiter_minutes / 60, 1)} theme={theme} />
              </div>

              {/* Reasons */}
              <div className="mt-4 space-y-1.5">
                {topVessel.explanation?.map((reason: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                    <div className={`w-1.5 h-1.5 rounded-full ${bgPrimary} mt-1.5 shrink-0`} />
                    <span className={textBody}>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer link to 3D reconstruction */}
      {spill?.status === 'attributed' && (
        <div className={`p-4 border-t ${borderBg} ${theme === 'dark' ? 'bg-[#151F33]' : 'bg-slate-50'} shrink-0`}>
          <Link
            to="/incident-reconstruction"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0EA5E9]/80 text-[#090D16] font-semibold text-xs transition-all shadow-lg hover:scale-[1.01]"
          >
            <span>View 3D Reconstruction</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, theme }: { icon: React.ReactNode; label: string; value: string; theme: 'light' | 'dark' }) {
  const textHeading = theme === 'dark' ? 'text-[#F8FAFC]' : 'text-[#1A1D23]';
  return (
    <div className="flex items-center gap-3">
      <div className="text-[#64748B]">{icon}</div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-[#64748B]">{label}</div>
        <div className={`text-sm ${textHeading} font-medium`}>{value}</div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, theme }: { label: string; value: number; theme: 'light' | 'dark' }) {
  const pct = Math.round(value * 100);
  const textBody = theme === 'dark' ? 'text-[#94A3B8]' : 'text-[#4B5563]';
  const bgPrimary = theme === 'dark' ? 'bg-[#0EA5E9]' : 'bg-[#00B894]';
  const trackBg = theme === 'dark' ? 'bg-[#090D16]' : 'bg-slate-200';

  return (
    <div>
      <div className="flex justify-between text-[11px] text-[#94A3B8] mb-1">
        <span className={textBody}>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className={`h-1.5 ${trackBg} rounded-full overflow-hidden`}>
        <div className={`h-full ${bgPrimary} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
