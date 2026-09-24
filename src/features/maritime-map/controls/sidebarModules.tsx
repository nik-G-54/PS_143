import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory, SpillEnvironment } from '../types/trajectoryTypes';
import type { AttributedVessel, SpillAttribution, VesselSubScores } from '../types/attributionTypes';
import {
  formatArea,
  formatCandidates,
  formatConfidence,
  formatCoordinates,
  formatDetectedAt,
  formatLatLon,
  formatUtcTimestamp,
} from '../utils/formatSpill';
import {
  formatDistanceKm,
  formatDriftWindow,
  formatPositionCount,
  formatUncertaintyRadius,
} from '../utils/formatTrajectory';
import { DiagnosticPlotViewer } from '../../../components/common/DiagnosticPlotViewer';
import { TrajectoryChart } from '../charts/TrajectoryChart';
import { CandidateScoreChart, VesselApproachChart, VesselScoreRadar } from '../charts/VesselCharts';

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-[11px] tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function ModuleCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="maritime-panel-card p-2.5">
      {title && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>
      )}
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Pending({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      {children}
    </p>
  );
}

/** Release time — backend estimate first, else the backtrack's first point. */
function releaseTimeLabel(spill: MapSpill, trajectory: SpillTrajectory | null): string {
  if (spill.estimatedReleaseTime) return formatUtcTimestamp(Date.parse(spill.estimatedReleaseTime));
  if (trajectory?.points[0]) return formatUtcTimestamp(trajectory.points[0].timestampMs);
  return '—';
}

/* ------------------------------------------------------------------ */
/* Incident details                                                    */
/* ------------------------------------------------------------------ */

export function IncidentModule({
  spill,
  trajectory,
}: {
  spill: MapSpill;
  trajectory: SpillTrajectory | null;
}) {
  const sourceLon = trajectory?.source?.longitude ?? spill.estimatedSourceLongitude;
  const sourceLat = trajectory?.source?.latitude ?? spill.estimatedSourceLatitude;
  const sourceRadius = trajectory?.source?.radiusKm ?? spill.estimatedSourceRadiusKm;

  return (
    <>
      <ModuleCard title="Detection">
        <Field label="Detected" value={formatDetectedAt(spill)} />
        <Field label="Area" value={formatArea(spill.areaKm2)} />
        <Field label="Confidence" value={formatConfidence(spill.confidenceScore)} />
        <Field label="Centroid" value={formatCoordinates(spill)} />
        <Field
          label="Estimated age"
          value={spill.estimatedAgeHours != null ? `${spill.estimatedAgeHours.toFixed(1)} h` : '—'}
        />
        <Field label="Source type" value={spill.sourceType ?? '—'} />
      </ModuleCard>

      {sourceLat != null && sourceLon != null && (
        <ModuleCard title="Probable source">
          <Field label="Coordinates" value={formatLatLon(sourceLon, sourceLat)} />
          <Field label="Uncertainty" value={formatUncertaintyRadius(sourceRadius)} />
          <Field label="Est. release" value={releaseTimeLabel(spill, trajectory)} />
        </ModuleCard>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Image                                                               */
/* ------------------------------------------------------------------ */

export function ImageModule({ spill }: { spill: MapSpill }) {
  return (
    <>
      <ModuleCard title="Drift diagnostic">
        <DiagnosticPlotViewer
          spillId={spill.spillId}
          fallbackUrl={spill.imageUrl}
          alt={`Drift diagnostic plot for ${spill.spillId}`}
          containerClassName="aspect-[4/3] w-full"
          badgeText="Diagnostic"
        />
      </ModuleCard>
      <p className="px-0.5 text-[10px] leading-relaxed text-muted-foreground">
        SAR observation with detection overlays. Use the expand control for full-screen zoom.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Vessels                                                             */
/* ------------------------------------------------------------------ */

/** Backend sub-score order — strongest spatial evidence first, weakest behavioural last. */
const SUB_SCORES: { key: keyof VesselSubScores; label: string }[] = [
  { key: 'proximity', label: 'Proximity' },
  { key: 'approach', label: 'Approach' },
  { key: 'temporal', label: 'Timing' },
  { key: 'departure', label: 'Departure' },
  { key: 'loiter', label: 'Loiter' },
  { key: 'slowdown', label: 'Slowdown' },
];

/** Below this a signal reads as weak evidence and is tinted amber, same tone as a failed reasoning check. */
const WEAK_SIGNAL = 0.25;

function formatFlag(code: string | null): string {
  if (!code) return '—';
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase());
    return name && name !== code ? `${name} (${code})` : code;
  } catch {
    return code;
  }
}

/** Signed backend offset → "16 min before release" / "1.2 h after release". */
function formatReleaseOffset(hours: number | null): string {
  if (hours == null) return '—';
  const abs = Math.abs(hours);
  const magnitude = abs < 1 ? `${Math.round(abs * 60)} min` : `${abs.toFixed(1)} h`;
  if (abs < 1 / 60) return 'At release';
  return `${magnitude} ${hours < 0 ? 'before' : 'after'} release`;
}

function formatAngle(value: number | null): string {
  return value != null ? `${Math.round(value)}°` : '—';
}

function ScoreBar({
  label,
  value,
  index,
  emphasis = false,
}: {
  label: string;
  value: number | null;
  index: number;
  emphasis?: boolean;
}) {
  const pct = value != null ? Math.max(0, Math.min(1, value)) * 100 : 0;
  const weak = value != null && value < WEAK_SIGNAL;
  return (
    <div className="grid grid-cols-[72px_1fr_34px] items-center gap-2">
      <span className={`text-[11px] ${emphasis ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        {value != null && (
          <div
            className={`maritime-score-fill h-full rounded-full ${
              weak ? 'bg-amber-500/80' : emphasis ? 'bg-primary' : 'maritime-primary-soft'
            }`}
            style={{ width: `${pct}%`, animationDelay: `${index * 90}ms` }}
          />
        )}
      </div>
      <span
        className={`text-right font-mono text-[10px] tabular-nums ${
          weak ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
        }`}
      >
        {value != null ? `${Math.round(value * 100)}%` : '—'}
      </span>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

function VesselCard({
  vessel,
  rank,
  defaultOpen,
}: {
  vessel: AttributedVessel;
  rank: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const type = vessel.vesselType ?? vessel.shiptypeName;

  return (
    <div className="maritime-panel-card p-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 text-left"
      >
        <span
          className={`mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded px-1 font-mono text-[10px] font-semibold ${
            rank === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          #{rank}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-[12px] font-semibold text-foreground">
            {vessel.vesselName}
          </span>
          <span className="block truncate text-[10px] text-muted-foreground" title={vessel.shiptypeName ?? undefined}>
            {[type, vessel.country].filter(Boolean).join(' · ') || '—'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <span className="font-mono text-[12px] font-semibold tabular-nums text-primary">
            {formatConfidence(vessel.score)}
          </span>
          <ChevronDown
            size={13}
            className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      <div className="mt-2">
        <ScoreBar label="Overall" value={vessel.score} index={0} emphasis />
      </div>

      {open && (
        <div className="mt-2 space-y-1.5 border-t border-border pt-2">
          <div className="flex items-center justify-between">
            <SubHeading>Identity</SubHeading>
            {vessel.identifiersSynthetic && (
              <span
                className="rounded border border-amber-500/40 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400"
                title="MMSI, IMO and name are generated placeholders, not real registry identifiers."
              >
                Synthetic IDs
              </span>
            )}
          </div>
          <Field label="MMSI" value={vessel.mmsi ?? '—'} />
          <Field label="IMO" value={vessel.imo ?? '—'} />
          <Field label="Flag" value={formatFlag(vessel.country)} />
          <Field label="Type" value={type ?? '—'} />

          <SubHeading>Movement</SubHeading>
          <Field label="Speed" value={vessel.speed != null ? `${vessel.speed.toFixed(1)} kn` : '—'} />
          <Field label="Course" value={formatAngle(vessel.course)} />
          <Field label="Heading" value={formatAngle(vessel.heading)} />

          <SubHeading>Relation to spill</SubHeading>
          <Field
            label="Origin distance"
            value={vessel.distanceFromOriginKm != null ? `${vessel.distanceFromOriginKm.toFixed(2)} km` : '—'}
          />
          <Field label="Timing" value={formatReleaseOffset(vessel.timeDifferenceHours)} />
          <Field label="Track correlation" value={formatConfidence(vessel.trajectoryCorrelation)} />

          <SubHeading>Score breakdown</SubHeading>
          <div className="space-y-1.5">
            {SUB_SCORES.map((s, i) => (
              <ScoreBar key={s.key} label={s.label} value={vessel.subScores[s.key]} index={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function VesselsModule({
  spill,
  attribution,
  isLoading,
  trajectory,
}: {
  spill: MapSpill;
  attribution: SpillAttribution | null;
  isLoading: boolean;
  /** Backtrack solution — supplies the origin estimate and release time the approach chart is measured against. */
  trajectory: SpillTrajectory | null;
}) {
  // Mock/comparison vessels never appear in the investigation UI.
  const vessels = (attribution?.vessels ?? []).filter((v) => !v.isMock);
  const count = attribution?.candidateCount ?? spill.candidateCount;
  const topVessel = vessels[0] ?? null;

  const origin =
    trajectory?.source ??
    (spill.estimatedSourceLatitude != null && spill.estimatedSourceLongitude != null
      ? { longitude: spill.estimatedSourceLongitude, latitude: spill.estimatedSourceLatitude }
      : (trajectory?.points[0] ?? null));
  const releaseTimeMs = spill.estimatedReleaseTime
    ? Date.parse(spill.estimatedReleaseTime)
    : (trajectory?.points[0]?.timestampMs ?? null);

  return (
    <>

      <ModuleCard>
        <Field label="AIS candidates" value={formatCandidates(count)} />
      </ModuleCard>

      {isLoading && <Pending>Querying candidate vessels…</Pending>}

      {!isLoading &&
        vessels.map((vessel, idx) => (
          <VesselCard
            key={vessel.vesselId}
            vessel={vessel}
            rank={vessel.rank > 0 && vessel.rank < 999 ? vessel.rank : idx + 1}
            defaultOpen={idx === 0}
          />
        ))}

      {!isLoading && vessels.length === 0 && (
        <p className="text-[11px] text-muted-foreground">No candidate vessels recorded for this spill.</p>
      )}

      {!isLoading && topVessel && (
        <>
          <VesselScoreRadar vessel={topVessel} />
          <VesselApproachChart
            vessel={topVessel}
            origin={origin}
            releaseTimeMs={releaseTimeMs != null && Number.isFinite(releaseTimeMs) ? releaseTimeMs : null}
            driftRadiusKm={
              attribution?.searchParameters?.driftUncertaintyRadiusKm ?? trajectory?.source?.radiusKm ?? null
            }
          />
          <CandidateScoreChart vessels={vessels} />
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Time / drift                                                        */
/* ------------------------------------------------------------------ */

export function TimeModule({
  spill,
  trajectory,
  environment,
  isLoading,
  error,
  currentTimeMs,
}: {
  spill: MapSpill;
  trajectory: SpillTrajectory | null;
  environment: SpillEnvironment | null;
  isLoading: boolean;
  error: string | null;
  currentTimeMs: number | null;
}) {
  return (
    <>
      <ModuleCard title="Timeline">
        <Field label="Est. release" value={releaseTimeLabel(spill, trajectory)} />
        <Field label="Detected" value={formatDetectedAt(spill)} />
        {currentTimeMs != null && <Field label="Playback" value={formatUtcTimestamp(currentTimeMs)} />}
      </ModuleCard>

      <ModuleCard title="Drift backtrack">
        {isLoading && <Pending>Solving drift path…</Pending>}
        {!isLoading && error && <p className="text-[11px] text-muted-foreground">{error}</p>}
        {!isLoading && !error && trajectory && (
          <>
            <Field label="Backtracked" value={formatDriftWindow(trajectory.durationHours)} />
            <Field label="Path length" value={formatDistanceKm(trajectory.totalDistanceKm)} />
            <Field label="Positions" value={formatPositionCount(trajectory.points.length)} />
            <Field
              label="Origin uncertainty"
              value={formatUncertaintyRadius(trajectory.source?.radiusKm ?? null)}
            />
          </>
        )}
        {!isLoading && !error && !trajectory && (
          <p className="text-[11px] text-muted-foreground">No drift solution available.</p>
        )}
      </ModuleCard>

      {(environment?.wind || environment?.current) && (
        <ModuleCard title="Forcing">
          {environment?.wind && (
            <Field
              label="Wind"
              value={`${environment.wind.speed.toFixed(1)} ${environment.wind.unit} @ ${environment.wind.directionDeg.toFixed(0)}°`}
            />
          )}
          {environment?.current && (
            <Field
              label="Current"
              value={`${environment.current.speed.toFixed(2)} ${environment.current.unit} @ ${environment.current.directionDeg.toFixed(0)}°`}
            />
          )}
        </ModuleCard>
      )}

      {trajectory && <TrajectoryChart trajectory={trajectory} currentTimeMs={currentTimeMs} />}
    </>
  );
}
