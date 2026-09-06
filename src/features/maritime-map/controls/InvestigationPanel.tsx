import { Crosshair, Eye, EyeOff, Rewind, X } from 'lucide-react';
import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory } from '../types/trajectoryTypes';
import type { SpillAttribution } from '../types/attributionTypes';
import {
  formatArea,
  formatCandidates,
  formatConfidence,
  formatCoordinates,
  formatDetectedAt,
  formatLatLon,
} from '../utils/formatSpill';
import {
  formatDistanceKm,
  formatDriftWindow,
  formatPositionCount,
  formatUncertaintyRadius,
} from '../utils/formatTrajectory';

interface InvestigationPanelProps {
  spill: MapSpill;
  focusMode: boolean;
  trajectory: SpillTrajectory | null;
  isTrajectoryLoading: boolean;
  trajectoryError: string | null;
  attribution: SpillAttribution | null;
  isAttributionLoading: boolean;
  backtrackActive: boolean;
  playbackMode: 'forward' | 'backtrack';
  onSetPlaybackMode: (mode: 'forward' | 'backtrack') => void;
  onToggleFocusMode: () => void;
  onToggleBacktrack: () => void;
  onClear: () => void;
  onRecenter: () => void;
  onScrollToDetails: () => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[11px] tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

/** Readout of the backend backtrack solution for this detection. */
function DriftSection({
  trajectory,
  isLoading,
  error,
}: {
  trajectory: SpillTrajectory | null;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-1.5 border-t border-border pt-2.5">
      <SectionHeading>Drift backtrack</SectionHeading>

      {isLoading && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Solving drift path…
        </p>
      )}

      {!isLoading && error && <p className="text-[11px] text-muted-foreground">{error}</p>}

      {!isLoading && !error && trajectory && (
        <>
          <Field label="Backtracked" value={formatDriftWindow(trajectory.durationHours)} />
          <Field label="Path length" value={formatDistanceKm(trajectory.totalDistanceKm)} />
          <Field label="Positions" value={formatPositionCount(trajectory.points.length)} />
          {trajectory.source && (
            <>
              <Field
                label="Origin"
                value={formatLatLon(trajectory.source.longitude, trajectory.source.latitude)}
              />
              <Field
                label="Uncertainty"
                value={formatUncertaintyRadius(trajectory.source.radiusKm)}
              />
            </>
          )}
          <p className="pt-0.5 text-[10px] leading-relaxed text-muted-foreground">
            Path runs origin → detection, the backend&apos;s drift solution integrated backwards
            from this observation.
          </p>
        </>
      )}
    </div>
  );
}

function VesselSection({
  attribution,
  isLoading,
  active,
}: {
  attribution: SpillAttribution | null;
  isLoading: boolean;
  active: boolean;
}) {
  if (!active) return null;

  return (
    <div className="space-y-1.5 border-t border-border pt-2.5">
      <SectionHeading>Ranked vessels</SectionHeading>
      {isLoading && (
        <p className="text-[11px] text-muted-foreground">Loading AIS attribution…</p>
      )}
      {!isLoading && attribution && (
        <>
          <Field label="Candidates" value={String(attribution.candidateCount)} />
          {attribution.vessels.slice(0, 3).map((v) => (
            <Field key={v.vesselId} label={`#${v.rank} ${v.vesselName}`} value={v.vesselType ?? '—'} />
          ))}
        </>
      )}
    </div>
  );
}

export function InvestigationPanel({
  spill,
  focusMode,
  trajectory,
  isTrajectoryLoading,
  trajectoryError,
  attribution,
  isAttributionLoading,
  backtrackActive,
  playbackMode,
  onSetPlaybackMode,
  onToggleFocusMode,
  onToggleBacktrack,
  onClear,
  onRecenter,
  onScrollToDetails,
}: InvestigationPanelProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex max-h-[calc(100%-2rem)] w-[268px] flex-col overflow-hidden rounded-lg border border-border bg-card/92 shadow-lg backdrop-blur-md">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Under investigation
        </span>
        <button
          type="button"
          onClick={onClear}
          title="Clear investigation"
          className="-mr-1 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X size={13} />
        </button>
      </div>

      <div className="space-y-2.5 overflow-y-auto px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-primary">{spill.spillId}</span>
          <button
            type="button"
            onClick={onRecenter}
            title="Frame this spill and its drift path"
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Crosshair size={13} />
          </button>
        </div>

        <div className="space-y-1.5 border-t border-border pt-2.5">
          <Field label="Detected" value={formatDetectedAt(spill)} />
          <Field label="Area" value={formatArea(spill.areaKm2)} />
          <Field label="Detection conf." value={formatConfidence(spill.confidenceScore)} />
          <Field label="Candidates" value={formatCandidates(spill.candidateCount)} />
          <Field label="Centroid" value={formatCoordinates(spill)} />
        </div>

        <DriftSection
          trajectory={trajectory}
          isLoading={isTrajectoryLoading}
          error={trajectoryError}
        />

        <VesselSection
          attribution={attribution}
          isLoading={isAttributionLoading}
          active={backtrackActive}
        />

        {/* Arm / disarm investigation timeline */}
        <button
          type="button"
          onClick={onToggleBacktrack}
          disabled={!trajectory && !isTrajectoryLoading}
          className={`flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 ${
            backtrackActive
              ? 'border-amber-500/70 bg-amber-500/20 text-amber-300'
              : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          <Rewind size={13} />
          {backtrackActive ? 'Investigation on' : 'Investigate vessels'}
        </button>

        {/* Playback mode selector — only shown when armed */}
        {backtrackActive && (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onSetPlaybackMode('forward')}
              title="Forward Reconstruction: Origin → Detection"
              className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                playbackMode === 'forward'
                  ? 'border-cyan-500/70 bg-cyan-500/15 text-cyan-300'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              ▶ Forward
            </button>
            <button
              type="button"
              onClick={() => onSetPlaybackMode('backtrack')}
              title="Backtrack to Source: Detection → Origin"
              className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                playbackMode === 'backtrack'
                  ? 'border-amber-500/70 bg-amber-500/15 text-amber-300'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              ◀ Backtrack
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
            focusMode
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          {focusMode ? <EyeOff size={13} /> : <Eye size={13} />}
          {focusMode ? 'Focus mode on' : 'Focus mode'}
        </button>

        <button
          type="button"
          onClick={onScrollToDetails}
          className="w-full rounded-md border border-border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Evidence details ↓
        </button>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {focusMode ? 'Other detections hidden.' : 'Other detections dimmed for spatial context.'}
        </p>
      </div>
    </div>
  );
}