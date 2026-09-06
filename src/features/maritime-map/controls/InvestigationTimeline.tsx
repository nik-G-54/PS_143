import { Pause, Play } from 'lucide-react';

interface InvestigationTimelineProps {
  progress: number;
  isPlaying: boolean;
  windowLabel: string;
  onTogglePlay: () => void;
  onSeek: (progress: number) => void;
  disabled?: boolean;
}

/** Play / pause / scrub control for the oil ↔ vessel correlation window. */
export function InvestigationTimeline({
  progress,
  isPlaying,
  windowLabel,
  onTogglePlay,
  onSeek,
  disabled = false,
}: InvestigationTimelineProps) {
  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex w-[min(520px,calc(100%-2rem))] -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-card/94 px-3 py-2.5 shadow-lg backdrop-blur-md">
      <button
        type="button"
        disabled={disabled}
        onClick={onTogglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent disabled:opacity-40"
        title={isPlaying ? 'Pause' : 'Play backtrack'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Backtrack timeline
          </span>
          <span className="truncate font-mono text-[10px] tabular-nums text-muted-foreground">
            {windowLabel}
          </span>
        </div>
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
          <span>Origin</span>
          <span>Detection</span>
        </div>
      </div>
    </div>
  );
}
