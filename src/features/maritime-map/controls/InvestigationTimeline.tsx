import type { CSSProperties } from 'react';
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
  /** Playhead timestamp (UTC), from the backend drift samples. */
  currentTimeLabel?: string | null;
  /** Timestamp at the slider's left end (progress 0) — shown on hover of the end label. */
  startTimeLabel?: string | null;
  /** Timestamp at the slider's right end (progress 1). */
  endTimeLabel?: string | null;
  marks?: TimelineMark[];
}

/**
 * Play / pause / scrub control for the oil ↔ vessel correlation window —
 * one compact strip so it never covers the drift path it's driving:
 * play · mode + speed · scrub track with T-marks · playhead time.
 */
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
  currentTimeLabel,
  startTimeLabel,
  endTimeLabel,
  marks = [],
}: InvestigationTimelineProps) {
  const isBacktrack = playbackMode === 'backtrack';
  const modeLabel = isBacktrack ? 'Backtrack' : 'Forward';
  const leftLabel = isBacktrack ? 'Detection' : 'Origin';
  const rightLabel = isBacktrack ? 'Origin' : 'Detection';

  return (
    <div className="flex w-full items-center gap-3 px-3 py-2 text-card-foreground">
      <button
        type="button"
        disabled={disabled}
        onClick={onTogglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
        title={isPlaying ? 'Pause' : `Play ${modeLabel.toLowerCase()}`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
      </button>

      <div className="flex w-[92px] shrink-0 flex-col gap-0.5">
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
            isBacktrack ? 'text-amber-700 dark:text-amber-400' : 'text-cyan-700 dark:text-cyan-400'
          }`}
        >
          {isBacktrack ? '◀ ' : '▶ '}
          {modeLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-semibold tabular-nums text-foreground">{Math.round(progress * 100)}%</span>
          <select
            value={speed}
            disabled={disabled}
            onChange={(event) => onSpeedChange(Number(event.target.value) as PlaybackSpeed)}
            className="rounded border border-border bg-card px-0.5 font-mono text-[10px] font-semibold tabular-nums text-foreground disabled:opacity-40"
            aria-label="Playback speed"
            title="Playback speed"
          >
            {PLAYBACK_SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          disabled={disabled}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="maritime-timeline-slider block w-full"
          style={{ '--fill': `${progress * 100}%` } as CSSProperties}
          aria-label="Investigation timeline"
          aria-valuetext={currentTimeLabel ?? windowLabel}
        />
        {/* Ends + backend time-tick notches, aligned to the thumb's travel (7px = half the thumb). */}
        <div className="relative mx-[7px] mt-1 h-3 text-[9px] leading-none text-muted-foreground">
          <span className="absolute left-0 top-0 -translate-x-[7px] font-semibold uppercase tracking-wider" title={startTimeLabel ?? undefined}>
            {leftLabel}
          </span>
          <span className="absolute right-0 top-0 translate-x-[7px] font-semibold uppercase tracking-wider" title={endTimeLabel ?? undefined}>
            {rightLabel}
          </span>
          {marks
            .filter((m) => m.position > 0.1 && m.position < 0.9)
            .map((mark) => (
              <button
                key={`${mark.label}-${mark.position}`}
                type="button"
                disabled={disabled}
                onClick={() => onSeek(mark.position)}
                title={mark.title}
                className="absolute top-0 -translate-x-1/2 font-mono tabular-nums transition-colors hover:text-foreground"
                style={{ left: `${mark.position * 100}%` }}
              >
                {mark.label}
              </button>
            ))}
        </div>
      </div>

      <div className="flex w-[132px] shrink-0 flex-col items-end gap-0.5 text-right">
        <span className="truncate font-mono text-[10.5px] font-semibold tabular-nums text-foreground" title="Playhead time (UTC)">
          {currentTimeLabel ?? '—'}
        </span>
        <span className="truncate text-[9.5px] text-muted-foreground">{windowLabel}</span>
      </div>
    </div>
  );
}
