import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  CloudSun,
  Crosshair,
  FileSearch,
  Globe2,
  Radar as RadarIcon,
  Route,
  Satellite,
  ShieldQuestion,
  Ship,
  XCircle,
} from 'lucide-react';
import type { MapSpill } from '../types/spillTypes';
import type { SpillEnvironment, SpillTrajectory } from '../types/trajectoryTypes';
import type { AttributedVessel, SpillAttribution } from '../types/attributionTypes';
import type { SpillForecast } from '../types/forecastTypes';
import {
  ALERT_SEVERITY_CSS,
  ALERT_SEVERITY_LABEL,
  computeDistanceToCoast,
  computeForecastAlertSeverity,
  type CoastlineGeoJSON,
} from '../utils/coastalAlert';
import { formatArea, formatConfidence, formatDetectedAt, formatLatLon, formatUtcTimestamp } from '../utils/formatSpill';
import { formatDistanceKm, formatDriftWindow, formatUncertaintyRadius } from '../utils/formatTrajectory';
import { DiagnosticPlotViewer } from '../../../components/common/DiagnosticPlotViewer';
import { VesselApproachChart } from '../charts/VesselCharts';
import {
  AreaDistributionChart,
  CandidateRadarOverlay,
  DetectionTimelineChart,
  DriftProfileChart,
  ForcingCompass,
  ForecastProfileChart,
  LeadMarginChart,
  ScoreGauge,
  SignalMatrixChart,
  SpatioTemporalScatter,
  areaPercentile,
  computeLeadMargins,
  vesselColor,
} from './evidenceCharts';

interface EvidenceDashboardProps {
  open: boolean;
  onClose: () => void;
  spill: MapSpill;
  spills: MapSpill[];
  trajectory: SpillTrajectory | null;
  isTrajectoryLoading: boolean;
  environment: SpillEnvironment | null;
  attribution: SpillAttribution | null;
  isAttributionLoading: boolean;
  forecast: SpillForecast | null;
  isForecastLoading: boolean;
  forecastError: string | null;
  coastline: CoastlineGeoJSON | null;
}

const SECTIONS = [
  { id: 'ev-detection', label: 'Detection', icon: Satellite },
  { id: 'ev-drift', label: 'Drift', icon: Route },
  { id: 'ev-attribution', label: 'Attribution', icon: RadarIcon },
  { id: 'ev-suspect', label: 'Prime candidate', icon: Crosshair },
  { id: 'ev-forecast', label: 'Forecast', icon: CloudSun },
  { id: 'ev-context', label: 'Regional context', icon: Globe2 },
] as const;

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

function Section({
  id,
  index,
  title,
  summary,
  source,
  order,
  children,
}: {
  id: string;
  index: string;
  title: string;
  summary: string;
  source: string;
  order: number;
  children: ReactNode;
}) {
  return (
    <section id={id} className="maritime-evidence-section scroll-mt-28" style={{ animationDelay: `${180 + order * 70}ms` }}>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm font-bold tabular-nums text-primary">{index}</span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">{summary}</p>
          </div>
        </div>
        <span className="rounded border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground" title="Backend source">
          {source}
        </span>
      </header>
      {children}
    </section>
  );
}

function Card({
  title,
  caption,
  aside,
  className = '',
  children,
}: {
  title: string;
  caption?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article className={`rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h4>
          {caption && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{caption}</p>}
        </div>
        {aside}
      </div>
      {children}
    </article>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-border py-1.5 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right font-mono text-xs tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">{children}</p>;
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-xs text-muted-foreground">
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      {label}
    </div>
  );
}

function VesselLegend({ vessels }: { vessels: AttributedVessel[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {vessels.map((v, i) => (
        <span key={v.vesselId} className="flex items-center gap-1.5 text-[11px] text-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: vesselColor(i) }} />
          <span className="font-mono">#{v.rank}</span>
          <span className="max-w-[160px] truncate">{v.vesselName}</span>
          {v.isMock && (
            <span className="rounded border border-border px-1 text-[9px] uppercase tracking-wider text-muted-foreground">Comparison</span>
          )}
        </span>
      ))}
    </div>
  );
}

function formatOffset(hours: number | null): string {
  if (hours == null) return '—';
  const abs = Math.abs(hours);
  if (abs < 1 / 60) return 'at release';
  const mag = abs < 1 ? `${Math.round(abs * 60)} min` : `${abs.toFixed(1)} h`;
  return `${mag} ${hours < 0 ? 'before' : 'after'}`;
}

type CheckState = 'pass' | 'fail' | 'unknown';
const CHECK_ICON = { pass: CheckCircle2, fail: XCircle, unknown: ShieldQuestion };
const CHECK_TONE = { pass: 'text-green-600 dark:text-green-400', fail: 'text-amber-600 dark:text-amber-400', unknown: 'text-muted-foreground' };

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

/**
 * Full evidence dossier for the selected spill. Slides up beside the docked
 * map (see MaritimeMap.tsx's `evidenceOpen`), scrolls independently, and is
 * organised as numbered sections that follow the investigation's logic:
 * what was seen → where it came from → who was there → the prime candidate →
 * where it goes next → how it compares regionally. Each section names the
 * backend endpoint its figures come from.
 */
export function EvidenceDashboard({
  open,
  onClose,
  spill,
  spills,
  trajectory,
  isTrajectoryLoading,
  environment,
  attribution,
  isAttributionLoading,
  forecast,
  isForecastLoading,
  forecastError,
  coastline,
}: EvidenceDashboardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  // Contents mount when the dossier opens (so charts animate in as it rises)
  // and unmount only after the closing slide has finished.
  const [contentMounted, setContentMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setContentMounted(true);
      return;
    }
    const t = window.setTimeout(() => setContentMounted(false), 760);
    return () => window.clearTimeout(t);
  }, [open]);

  // Every candidate the backend ranked (comparison candidates included, and
  // labelled as such) — the comparison charts need the whole field.
  const vessels = useMemo(() => [...(attribution?.vessels ?? [])].sort((a, b) => a.rank - b.rank), [attribution]);
  const prime = vessels[0] ?? null;
  const leadRows = useMemo(() => computeLeadMargins(vessels), [vessels]);
  const signalLeads = leadRows.filter((r) => r.signal !== 'Overall');
  const leadsCount = signalLeads.filter((r) => r.margin > 0).length;
  const strongest = [...signalLeads].sort((a, b) => b.margin - a.margin)[0];
  const weakest = [...signalLeads].sort((a, b) => a.margin - b.margin)[0];

  const search = attribution?.searchParameters ?? null;
  const releaseMs = spill.estimatedReleaseTime ? Date.parse(spill.estimatedReleaseTime) : (trajectory?.points[0]?.timestampMs ?? null);
  const origin =
    trajectory?.source ??
    (spill.estimatedSourceLatitude != null && spill.estimatedSourceLongitude != null
      ? { longitude: spill.estimatedSourceLongitude, latitude: spill.estimatedSourceLatitude, radiusKm: spill.estimatedSourceRadiusKm }
      : null);

  const severity = computeForecastAlertSeverity(forecast, coastline);
  const coastKm = forecast?.predictedPosition && coastline ? computeDistanceToCoast(forecast.predictedPosition, coastline) : null;
  const percentile = areaPercentile(spills, spill.areaKm2);

  const checks: { label: string; state: CheckState; detail: string }[] = [
    {
      label: 'Inside transit search corridor',
      state: attribution?.candidateWithinCorridor == null ? 'unknown' : attribution.candidateWithinCorridor ? 'pass' : 'fail',
      detail: `${prime?.distanceFromOriginKm != null ? `${prime.distanceFromOriginKm.toFixed(2)} km from origin` : '—'}${
        search?.candidateSearchCorridorRadiusKm != null ? ` · corridor ${search.candidateSearchCorridorRadiusKm} km` : ''
      }`,
    },
    {
      label: 'Inside drift-uncertainty radius',
      state: attribution?.withinBacktrackRadius == null ? 'unknown' : attribution.withinBacktrackRadius ? 'pass' : 'fail',
      detail: search?.driftUncertaintyRadiusKm != null ? `Origin estimate ± ${search.driftUncertaintyRadiusKm} km` : 'Radius not reported',
    },
    {
      label: 'Inside release-time window',
      state:
        prime?.timeDifferenceHours == null || search?.temporalWindowHours == null
          ? 'unknown'
          : Math.abs(prime.timeDifferenceHours) <= search.temporalWindowHours
            ? 'pass'
            : 'fail',
      detail: `${formatOffset(prime?.timeDifferenceHours ?? null)} release${
        search?.temporalWindowHours != null ? ` · window ± ${search.temporalWindowHours} h` : ''
      }`,
    },
  ];

  // Scroll-spy for the section nav.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !open || !contentMounted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { root, rootMargin: '-96px 0px -60% 0px', threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = root.querySelector(`#${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [open, contentMounted]);

  // Opening always starts at the top of the dossier.
  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 });
  }, [open, spill.spillId]);

  const jumpTo = (id: string) => {
    const root = scrollRef.current;
    const el = root?.querySelector<HTMLElement>(`#${id}`);
    if (root && el) root.scrollTo({ top: el.offsetTop - 84, behavior: 'smooth' });
  };

  return (
    <aside
      className={`maritime-evidence ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
      aria-label="Evidence dossier"
      // Closed dossier must not be reachable by keyboard behind the map.
      inert={!open}
    >
      <div ref={scrollRef} className="maritime-evidence__scroll">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-2 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
                <FileSearch size={18} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Evidence dossier</p>
                <h2 className="truncate font-mono text-lg font-semibold text-foreground">
                  {spill.spillId}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">detected {formatDetectedAt(spill)}</span>
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
            >
              <ChevronLeft size={14} />
              Back to map
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-5 pb-2" aria-label="Dossier sections">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => jumpTo(s.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    active ? 'maritime-primary-tint text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-70">{String(i + 1).padStart(2, '0')}</span>
                  <Icon size={13} />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        {contentMounted && (
        <div className="mx-auto max-w-[1180px] space-y-10 px-6 pb-16 pt-6">
          {/* Assessment summary */}
          <div className="maritime-evidence-section space-y-4" style={{ animationDelay: '120ms' }}>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Assessment</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {prime ? (
                  <>
                    Prime candidate <span className="font-mono font-semibold text-primary">{prime.vesselName}</span>
                    {prime.vesselType ? ` (${prime.vesselType}${prime.country ? `, ${prime.country}` : ''})` : ''} scores{' '}
                    <span className="font-mono font-semibold">{formatConfidence(prime.score)}</span>
                    {signalLeads.length > 0 && (
                      <>
                        {' '}
                        and out-scores every other candidate on <span className="font-semibold">{leadsCount} of {signalLeads.length}</span> signals
                        {strongest && strongest.margin > 0 && <> — strongest lead on {strongest.signal.toLowerCase()} (+{strongest.margin} pts)</>}
                      </>
                    )}
                    . Passed the origin {formatOffset(prime.timeDifferenceHours)} release,{' '}
                    {prime.distanceFromOriginKm != null ? `${prime.distanceFromOriginKm.toFixed(2)} km` : 'at an unreported distance'} from the estimate.
                  </>
                ) : isAttributionLoading ? (
                  'Loading candidate vessels…'
                ) : (
                  'No candidate vessels were recorded for this detection.'
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Kpi label="Slick area" value={formatArea(spill.areaKm2)} sub={percentile != null ? `larger than ${percentile}% of detections` : undefined} />
              <Kpi label="Detection confidence" value={formatConfidence(spill.confidenceScore)} sub={spill.sourceType ?? undefined} />
              <Kpi label="Estimated age" value={spill.estimatedAgeHours != null ? `${spill.estimatedAgeHours.toFixed(1)} h` : '—'} sub="at detection" />
              <Kpi
                label="Drift backtracked"
                value={trajectory ? formatDistanceKm(trajectory.totalDistanceKm) : '—'}
                sub={trajectory ? `over ${formatDriftWindow(trajectory.durationHours)}` : undefined}
              />
              <Kpi label="Candidates" value={String(vessels.length || (spill.candidateCount ?? '—'))} sub={`${vessels.filter((v) => v.isMock).length} comparison`} />
              <Kpi label="Prime match" value={formatConfidence(prime?.score ?? spill.rankedTopScore)} sub={prime?.vesselName ?? spill.rankedTopVessel ?? undefined} accent="var(--primary)" />
            </div>
          </div>

          {/* 01 Detection */}
          <Section
            id="ev-detection"
            index="01"
            title="Detection & imagery"
            summary="The satellite observation that flagged the slick, and the detection record it produced."
            source="GET /demo/spills/{id}"
            order={0}
          >
            <div className="grid gap-4 lg:grid-cols-5">
              <Card title="SAR observation" caption="Detection overlay on the source scene. Expand for full-screen zoom." className="lg:col-span-3">
                <DiagnosticPlotViewer
                  spillId={spill.spillId}
                  fallbackUrl={spill.imageUrl}
                  alt={`Satellite observation of ${spill.spillId}`}
                  containerClassName="aspect-[16/10] w-full overflow-hidden rounded-lg border border-border"
                  badgeText="SAR"
                />
              </Card>
              <Card title="Detection record" className="lg:col-span-2">
                <ScoreGauge value={spill.confidenceScore} label="Detection confidence" />
                <dl className="mt-3">
                  <Fact label="Detected" value={formatDetectedAt(spill)} />
                  <Fact label="Centroid" value={formatLatLon(spill.longitude, spill.latitude)} />
                  {spill.observationLatitude != null && spill.observationLongitude != null && (
                    <Fact label="Observation point" value={formatLatLon(spill.observationLongitude, spill.observationLatitude)} />
                  )}
                  <Fact label="Area" value={formatArea(spill.areaKm2)} />
                  <Fact label="Source type" value={spill.sourceType ?? '—'} />
                  <Fact label="Estimated age" value={spill.estimatedAgeHours != null ? `${spill.estimatedAgeHours.toFixed(1)} h` : '—'} />
                </dl>
              </Card>
            </div>
          </Section>

          {/* 02 Drift */}
          <Section
            id="ev-drift"
            index="02"
            title="Drift reconstruction"
            summary="The slick integrated backwards through wind and current to its probable release point."
            source="GET /visualization/spills/{id}"
            order={1}
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <Card
                title="Drift profile"
                caption="Distance drifted (area) and drift speed per segment (line), from release to detection."
                className="lg:col-span-2"
              >
                {isTrajectoryLoading ? <Loading label="Solving drift path…" /> : trajectory && trajectory.points.length > 1 ? <DriftProfileChart trajectory={trajectory} /> : <Empty>No drift solution available.</Empty>}
              </Card>
              <div className="grid gap-4">
                <Card title="Forcing at detection">
                  <ForcingCompass environment={environment} />
                </Card>
                <Card title="Probable origin">
                  <dl>
                    <Fact label="Position" value={origin ? formatLatLon(origin.longitude, origin.latitude) : '—'} />
                    <Fact label="Uncertainty" value={formatUncertaintyRadius(origin?.radiusKm ?? null)} />
                    <Fact label="Est. release" value={releaseMs != null && Number.isFinite(releaseMs) ? formatUtcTimestamp(releaseMs) : '—'} />
                    <Fact label="Drift samples" value={trajectory ? String(trajectory.points.length) : '—'} />
                  </dl>
                </Card>
              </div>
            </div>
          </Section>

          {/* 03 Attribution */}
          <Section
            id="ev-attribution"
            index="03"
            title="Vessel attribution"
            summary="Every candidate the backend scored, compared signal by signal — and why rank #1 stands apart."
            source="GET /demo/spills/{id}/vessels"
            order={2}
          >
            {isAttributionLoading && vessels.length === 0 ? (
              <Loading label="Querying candidate vessels…" />
            ) : vessels.length === 0 ? (
              <Empty>No candidate vessels recorded for this spill.</Empty>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card
                  title="Signal comparison — all candidates"
                  caption="Overall match score and its six component signals for each candidate (0–100)."
                  className="lg:col-span-2"
                  aside={<VesselLegend vessels={vessels} />}
                >
                  <SignalMatrixChart vessels={vessels} />
                </Card>

                <Card title="Evidence profiles" caption="Rank #1 filled; other candidates outlined.">
                  <CandidateRadarOverlay vessels={vessels} />
                </Card>

                <Card
                  title="Why rank #1"
                  caption={
                    signalLeads.length > 0
                      ? `Rank #1 minus the best other candidate, per signal. Leads on ${leadsCount} of ${signalLeads.length}${
                          weakest && weakest.margin < 0 ? `; trails on ${weakest.signal.toLowerCase()} (${weakest.margin} pts)` : ''
                        }.`
                      : 'Needs at least two scored candidates.'
                  }
                >
                  {leadRows.length > 0 ? <LeadMarginChart rows={leadRows} /> : <Empty>Nothing to compare.</Empty>}
                </Card>

                <Card
                  title="Spatio-temporal fit"
                  caption="Each candidate's time offset and distance from the origin at release; bubble size is match score. Shaded box = search window."
                >
                  <SpatioTemporalScatter
                    vessels={vessels}
                    windowHours={search?.temporalWindowHours ?? null}
                    corridorKm={search?.candidateSearchCorridorRadiusKm ?? null}
                  />
                </Card>

                <Card title="Verification checks" caption="Backend verification of the prime candidate against its own search thresholds.">
                  <ul className="space-y-3">
                    {checks.map((c) => {
                      const Icon = CHECK_ICON[c.state];
                      return (
                        <li key={c.label} className="flex items-start gap-2.5">
                          <Icon size={16} className={`mt-0.5 shrink-0 ${CHECK_TONE[c.state]}`} />
                          <div>
                            <p className="text-sm text-foreground">{c.label}</p>
                            <p className="text-xs text-muted-foreground">{c.detail}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {attribution?.attributionQualification && (
                    <p className="mt-4 rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                      {attribution.attributionQualification}
                    </p>
                  )}
                </Card>

                <Card title="Candidate register" className="lg:col-span-2">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {['Rank', 'Vessel', 'Type', 'Flag', 'Speed', 'Distance', 'Timing', 'Track corr.', 'Score', 'Status'].map((h) => (
                            <th key={h} className="px-2 py-2 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vessels.map((v, i) => (
                          <tr key={v.vesselId} className={`border-b border-border last:border-0 ${i === 0 ? 'maritime-primary-tint' : ''}`}>
                            <td className="px-2 py-2 font-mono font-semibold" style={{ color: vesselColor(i) }}>
                              #{v.rank}
                            </td>
                            <td className="px-2 py-2 font-mono text-foreground">{v.vesselName}</td>
                            <td className="px-2 py-2 text-foreground">{v.vesselType ?? '—'}</td>
                            <td className="px-2 py-2 text-foreground">{v.country ?? '—'}</td>
                            <td className="px-2 py-2 font-mono tabular-nums">{v.speed != null ? `${v.speed.toFixed(1)} kn` : '—'}</td>
                            <td className="px-2 py-2 font-mono tabular-nums">{v.distanceFromOriginKm != null ? `${v.distanceFromOriginKm.toFixed(2)} km` : '—'}</td>
                            <td className="px-2 py-2 tabular-nums">{formatOffset(v.timeDifferenceHours)}</td>
                            <td className="px-2 py-2 font-mono tabular-nums">{formatConfidence(v.trajectoryCorrelation)}</td>
                            <td className="px-2 py-2 font-mono font-semibold tabular-nums">{formatConfidence(v.score)}</td>
                            <td className="px-2 py-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  i === 0 ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'
                                }`}
                              >
                                {i === 0 ? 'Prime' : v.isMock ? 'Comparison' : 'Candidate'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </Section>

          {/* 04 Prime candidate */}
          <Section
            id="ev-suspect"
            index="04"
            title="Prime candidate"
            summary="Identity and movement of the rank #1 vessel around the release time."
            source="GET /demo/spills/{id}/attribution/trajectory"
            order={3}
          >
            {prime ? (
              <div className="grid gap-4 lg:grid-cols-5">
                <Card
                  title="Vessel identity"
                  className="lg:col-span-2"
                  aside={
                    prime.identifiersSynthetic ? (
                      <span className="rounded border border-amber-500/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Synthetic IDs
                      </span>
                    ) : undefined
                  }
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Ship size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-semibold text-foreground">{prime.vesselName}</p>
                      <p className="text-xs text-muted-foreground">{[prime.vesselType ?? prime.shiptypeName, prime.country].filter(Boolean).join(' · ') || '—'}</p>
                    </div>
                  </div>
                  <dl>
                    <Fact label="Vessel ID" value={prime.vesselId} />
                    <Fact label="MMSI" value={prime.mmsi ?? '—'} />
                    <Fact label="IMO" value={prime.imo ?? '—'} />
                    <Fact label="Speed / course" value={`${prime.speed != null ? `${prime.speed.toFixed(1)} kn` : '—'} · ${prime.course != null ? `${Math.round(prime.course)}°` : '—'}`} />
                    <Fact label="Distance to origin" value={prime.distanceFromOriginKm != null ? `${prime.distanceFromOriginKm.toFixed(2)} km` : '—'} />
                    <Fact label="Timing" value={`${formatOffset(prime.timeDifferenceHours)} release`} />
                    <Fact label="Track correlation" value={formatConfidence(prime.trajectoryCorrelation)} />
                    <Fact label="AIS samples" value={prime.track.length > 0 ? String(prime.track.length) : 'arm backtrack to load'} />
                  </dl>
                </Card>
                <div className="lg:col-span-3">
                  <VesselApproachChart
                    vessel={prime}
                    origin={origin}
                    releaseTimeMs={releaseMs != null && Number.isFinite(releaseMs) ? releaseMs : null}
                    driftRadiusKm={search?.driftUncertaintyRadiusKm ?? origin?.radiusKm ?? null}
                  />
                </div>
              </div>
            ) : (
              <Empty>No prime candidate.</Empty>
            )}
          </Section>

          {/* 05 Forecast */}
          <Section
            id="ev-forecast"
            index="05"
            title="Drift forecast"
            summary="Where the slick is predicted to travel next, and how close that brings it to the coast."
            source="GET /demo/spills/{id}/predict"
            order={4}
          >
            {isForecastLoading ? (
              <Loading label="Running drift forecast…" />
            ) : forecastError ? (
              <Empty>{forecastError}</Empty>
            ) : forecast ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <Kpi label="Horizon" value={`+${forecast.durationHours.toFixed(0)} h`} />
                  <Kpi label="Net displacement" value={forecast.totalDisplacementKm != null ? `${forecast.totalDisplacementKm.toFixed(2)} km` : '—'} />
                  <Kpi label="Net heading" value={forecast.netHeadingDeg != null ? `${Math.round(forecast.netHeadingDeg)}°` : '—'} />
                  <Kpi label="Avg drift speed" value={forecast.averageSpeedKnots != null ? `${forecast.averageSpeedKnots.toFixed(2)} kn` : '—'} />
                  <Kpi label="To coastline" value={coastKm != null ? `${coastKm.toFixed(1)} km` : '—'} sub="from predicted position" />
                  <Kpi label="Coastal alert" value={severity ? ALERT_SEVERITY_LABEL[severity] : '—'} accent={severity ? ALERT_SEVERITY_CSS[severity] : undefined} />
                </div>
                <Card title="Forecast profile" caption="Predicted cumulative drift (area) and drift speed (line) across the horizon.">
                  <ForecastProfileChart forecast={forecast} />
                </Card>
              </div>
            ) : (
              <Empty>No forecast available.</Empty>
            )}
          </Section>

          {/* 06 Context */}
          <Section
            id="ev-context"
            index="06"
            title="Regional context"
            summary={`This detection against all ${spills.length} detections in the archive.`}
            source="GET /demo/spills"
            order={5}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Detections over time" caption="Monthly detection count; this spill's month highlighted.">
                <DetectionTimelineChart spills={spills} selected={spill} />
              </Card>
              <Card
                title="Slick size distribution"
                caption={percentile != null ? `This slick is larger than ${percentile}% of archived detections (highlighted bin).` : 'Area not reported.'}
              >
                <AreaDistributionChart spills={spills} selected={spill} />
              </Card>
            </div>
          </Section>

          <footer className="border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            Figures are reported by the NAUKA backend; the frontend only derives geometry (distances and speeds between reported
            positions) and archive counts. Ranking and scoring are backend-owned. Candidates marked <em>Comparison</em> are
            synthetic baselines included for contrast.
          </footer>
        </div>
        )}
      </div>
    </aside>
  );
}
