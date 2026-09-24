import type { CSSProperties, ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import { PLAYBACK_SPEEDS, type PlaybackSpeed } from '../timeline/useInvestigationTimeline';

/** A labelled notch on the scrub track — one per backend drift sample chosen as a time tick. */
export interface TimelineMark {
  /** 0..1 along the slider, in the same direction as `progress`. */
  position: number;
  /** Short label under the notch, e.g. "T-4h". */
  label: string;
  /** Full timestamp shown on hover. */
  title: string;
}

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
  /** Optional extra details rendered above the playback controls. */
  extraInfo?: ReactNode;
  /** Playhead timestamp (UTC), from the backend drift samples. */
  currentTimeLabel?: string | null;
  /** Timestamp at the slider's left end (progress 0). */
  startTimeLabel?: string | null;
  /** Timestamp at the slider's right end (progress 1). */
  endTimeLabel?: string | null;
  marks?: TimelineMark[];
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
  extraInfo,
  currentTimeLabel,
  startTimeLabel,
  endTimeLabel,
  marks = [],
}: InvestigationTimelineProps) {
  const isBacktrack = playbackMode === 'backtrack';
  const modeLabel = isBacktrack ? '◀ Backtrack to Source' : '▶ Forward Reconstruction';
  const leftLabel = isBacktrack ? 'Detection' : 'Origin';
  const rightLabel = isBacktrack ? 'Origin' : 'Detection';

  const progressPct = `${Math.round(progress * 100)}%`;

  return (
    <div className="flex w-full flex-col gap-1.5 px-4 py-3 text-card-foreground">
      {extraInfo && <div className="mb-0.5 flex items-center gap-3 border-b border-border pb-1.5">{extraInfo}</div>}

      {/* Mode badge + progress · playhead time + speed */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.16em] ${
              isBacktrack ? 'text-amber-700 dark:text-amber-400' : 'text-cyan-700 dark:text-cyan-400'
            }`}
          >
            {modeLabel}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums text-foreground">
            {progressPct}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {currentTimeLabel && (
            <span className="truncate font-mono text-[10px] font-semibold tabular-nums text-foreground" title="Playhead time">
              {currentTimeLabel}
            </span>
          )}
          <span className="hidden truncate font-mono text-[10px] tabular-nums text-muted-foreground sm:inline">
            {windowLabel}
          </span>
          <select
            value={speed}
            disabled={disabled}
            onChange={(event) => onSpeedChange(Number(event.target.value) as PlaybackSpeed)}
            className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-foreground disabled:opacity-40"
            aria-label="Playback speed"
            title="Playback speed"
          >
            {PLAYBACK_SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Playback row */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onTogglePlay}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:opacity-40"
          title={isPlaying ? 'Pause' : modeLabel}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex h-5 items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={progress}
              disabled={disabled}
              onChange={(event) => onSeek(Number(event.target.value))}
              className="maritime-timeline-slider relative z-[1] w-full"
              style={{ '--fill': `${progress * 100}%` } as CSSProperties}
              aria-label="Investigation timeline"
              aria-valuetext={currentTimeLabel ?? windowLabel}
            />
          </div>

          {/* Notches for the backend's time ticks, aligned to the thumb's travel (7px inset = half the thumb). */}
          {marks.length > 0 && (
            <div className="relative mx-[7px] h-4">
              {marks.map((mark) => (
                <button
                  key={`${mark.label}-${mark.position}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSeek(mark.position)}
                  title={mark.title}
                  className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-px text-muted-foreground transition-colors hover:text-foreground"
                  style={{ left: `${mark.position * 100}%` }}
                >
                  <span className="h-1.5 w-px bg-current" />
                  <span className="font-mono text-[9px] leading-none tabular-nums">{mark.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-1 flex justify-between gap-3 text-[9px] uppercase tracking-wider text-muted-foreground">
            <span className="min-w-0 truncate">
              <span className="font-semibold text-foreground">{leftLabel}</span>
              {startTimeLabel && <span className="ml-1.5 font-mono normal-case tracking-normal">{startTimeLabel}</span>}
            </span>
            <span className="min-w-0 truncate text-right">
              {endTimeLabel && <span className="mr-1.5 font-mono normal-case tracking-normal">{endTimeLabel}</span>}
              <span className="font-semibold text-foreground">{rightLabel}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
