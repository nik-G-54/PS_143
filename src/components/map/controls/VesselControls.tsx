// src/components/map/controls/VesselControls.tsx
interface VesselControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  spillTime: number;
  vesselCount: number;
  showTrails: boolean;
  onToggleTrails: () => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function VesselControls({
  isPlaying,
  onTogglePlay,
  currentTime,
  spillTime,
  vesselCount,
  showTrails,
  onToggleTrails,
}: VesselControlsProps) {
  const startTime = spillTime - 6 * 3600 * 1000;
  const totalDuration = 8 * 3600 * 1000;
  const progress = ((currentTime - startTime) / totalDuration) * 100;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30
      bg-slate-950/80 backdrop-blur-xl border border-slate-700/50
      rounded-2xl px-5 py-3 flex items-center gap-4
      shadow-[0_4px_30px_rgba(0,0,0,0.5)]">

      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/40
          flex items-center justify-center text-cyan-300 hover:bg-cyan-500/30 transition cursor-pointer"
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="4" height="12" rx="1"/>
            <rect x="8" y="1" width="4" height="12" rx="1"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5v11l9-5.5z"/>
          </svg>
        )}
      </button>

      {/* Timeline bar */}
      <div className="flex-1 min-w-[200px]">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
          {/* Spill event marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-red-500 rounded"
            style={{ left: '75%' }} // spill is at 75% of 8hr window
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>{formatTime(spillTime - 6 * 3600 * 1000)}</span>
          <span className="text-red-400 font-bold">
            🔴 SPILL {formatTime(spillTime)}
          </span>
          <span>{formatTime(spillTime + 2 * 3600 * 1000)}</span>
        </div>
      </div>

      {/* Current time */}
      <div className="text-cyan-300 font-mono text-sm font-bold min-w-[55px] text-right">
        {formatTime(currentTime)}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-700" />

      {/* Trails toggle */}
      <button
        onClick={onToggleTrails}
        className={`text-xs font-medium px-2 py-1 rounded transition cursor-pointer ${
          showTrails
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            : 'text-slate-500 border border-slate-700'
        }`}
      >
        {showTrails ? '〰️ Trails' : '• Dots'}
      </button>

      {/* Vessel count */}
      <span className="text-xs text-slate-500 font-mono">
        🚢 {vesselCount} vessels
      </span>
    </div>
  );
}
