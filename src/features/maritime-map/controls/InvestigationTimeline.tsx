import { Pause, Play } from 'lucide-react';
import { PLAYBACK_SPEEDS, type PlaybackSpeed } from '../timeline/useInvestigationTimeline';

interface InvestigationTimelineProps {
  progress: number;
  isPlaying: boolean;
  windowLabel: string;
  onTogglePlay: () => void;
  onSeek: (progress: number) => void;
  playbackMode: 'forward' | 'backtrack';
  speed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  atSource?: boolean;
  disabled?: boolean;
}

/** Play / pause / scrub control for the oil ↔ vessel correlation window. */
export function InvestigationTimeline({
  progress,
  isPlaying,
  windowLabel,
  onTogglePlay,
  onSeek,
  playbackMode,
  speed,
  onSpeedChange,
  disabled = false,
}: InvestigationTimelineProps) {
  const isBacktrack = playbackMode === 'backtrack';
  const modeLabel = isBacktrack ? '◀ Backtrack to Source' : '▶ Forward Reconstruction';
  const leftLabel = isBacktrack ? 'Detection' : 'Origin';
  const rightLabel = isBacktrack ? 'Origin' : 'Detection';

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex w-[min(560px,calc(100%-2rem))] -translate-x-1/2 flex-col gap-1.5 rounded-lg border border-border bg-card text-card-foreground px-3 py-2.5 shadow-lg backdrop-blur-md">

      {/* Mode badge */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
          isBacktrack ? 'text-amber-700 dark:text-amber-400' : 'text-cyan-700 dark:text-cyan-400'
        }`}>
          {modeLabel}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={speed}
            disabled={disabled}
            onChange={(event) => onSpeedChange(Number(event.target.value) as PlaybackSpeed)}
            className="rounded border border-border bg-transparent px-1 py-0.5 font-mono text-[9px] font-semibold tabular-nums text-muted-foreground disabled:opacity-40"
            aria-label="Playback speed"
            title="Playback speed"
          >
            {PLAYBACK_SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
          <span className="truncate font-mono text-[10px] tabular-nums text-muted-foreground">
            {windowLabel}
          </span>
        </div>
      </div>

      {/* Playback row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onTogglePlay}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent disabled:opacity-40"
          title={isPlaying ? 'Pause' : modeLabel}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            disabled={disabled}
            onChange={(event) => onSeek(Number(event.target.value))}
            className="maritime-timeline-slider w-full"
            aria-label="Investigation timeline"
          />
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-muted-foreground/80">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}