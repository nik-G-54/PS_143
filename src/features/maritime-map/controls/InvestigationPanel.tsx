import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Rewind,
  Route,
  Search,
  Ship,
  TrendingUp,
  X,
} from 'lucide-react';
import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory } from '../types/trajectoryTypes';
import type { SpillForecast } from '../types/forecastTypes';
import type { SpillAttribution } from '../types/attributionTypes';
import type { InvestigationMode } from '../deck/deckLayers';
import {
  type AlertSeverity,
  type CoastlineGeoJSON,
  computeForecastAlertSeverity,
} from '../utils/coastalAlert';
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
  investigationMode: InvestigationMode;
  onSetInvestigationMode: (mode: InvestigationMode) => void;
  isForecastLoading: boolean;
  forecastError: string | null;
  forecast: SpillForecast | null;
  coastline: CoastlineGeoJSON | null;
  onToggleFocusMode: () => void;
  onToggleBacktrack: () => void;
  onClear: () => void;
  onRecenter: () => void;
  onScrollToDetails: () => void;
  /**
   * True once the vessel-reveal sequence starts (`vesselReveal.stage !== 'idle'`
   * in MaritimeMap.tsx). Collapses this panel to just its header the moment
   * that happens — see the effect below — so `VesselReasoningPanel` has room
   * to sit underneath it in the same sidebar column instead of replacing it
   * outright. A one-shot nudge, not a lock: the investigator can still
   * re-expand this panel by hand afterward.
   */
  autoCollapse?: boolean;
}

/** Banner background per severity — the whole point is to be readable at a glance. */
const COASTAL_ALERT_STYLES: Record<AlertSeverity, string> = {
  monitor: 'border-green-500/70 bg-green-500/15 text-green-700 dark:text-green-300',
  advisory: 'border-yellow-500/70 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
  watch: 'border-orange-500/70 bg-orange-500/15 text-orange-700 dark:text-orange-300',
  critical: 'border-red-500/70 bg-red-500/15 text-red-700 dark:text-red-300',
};

/**
 * How urgently the predicted landfall should read. `critical`/`watch` add a
 * simulated notification line — no email is actually sent, this is a UI
 * mock of what a real alerting pipeline would surface here.
 */
function CoastalAlertBanner({ severity }: { severity: AlertSeverity }) {
  const notifies = severity === 'critical' || severity === 'watch';

  return (
    <div className={`rounded-md border px-2 py-1.5 ${COASTAL_ALERT_STYLES[severity]}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
        <AlertTriangle size={12} className="shrink-0" />
        Coastal alert: {severity}
      </div>
      {notifies && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px] normal-case tracking-normal opacity-90">
          <Mail size={11} className="shrink-0" />
          Alert emailed to nikhilgupta542006@gmail.com
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[11px] tabular-nums text-foreground">{value}</span>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  badge,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  return (
    <div className="maritime-panel-card p-2.5">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between text-left transition-colors hover:text-foreground cursor-pointer select-none group"
        title={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {icon}
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground group-hover:text-foreground">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {isExpanded ? (
            <ChevronUp size={12} className="text-muted-foreground group-hover:text-foreground" />
          ) : (
            <ChevronDown size={12} className="text-muted-foreground group-hover:text-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-1.5 pt-2">
          {children}
        </div>
      )}
    </div>
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
    <CollapsibleSection
      title="Drift backtrack"
      icon={<Route size={12} className="text-primary shrink-0" />}
    >
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
          <p className="pt-0.5 text-[10px] leading-relaxed text-muted-foreground">
            Path runs origin → detection, the backend&apos;s drift solution integrated backwards
            from this observation.
          </p>
        </>
      )}
    </CollapsibleSection>
  );
}

function CandidateSummarySection({
  attribution,
  spill,
  isLoading,
}: {
  attribution: SpillAttribution | null;
  spill: MapSpill;
  isLoading: boolean;
}) {
  const count = attribution?.candidateCount ?? spill.candidateCount;
  const topVessel = attribution?.vessels[0];
  const topName = topVessel?.vesselName ?? spill.rankedTopVessel ?? '—';
  const topScore = topVessel?.score ?? spill.rankedTopScore;
  const topDist = topVessel?.distanceFromOriginKm;

  return (
    <CollapsibleSection
      title="Candidate Summary"
      icon={<Ship size={12} className="text-primary shrink-0" />}
      badge={
        count > 0 ? (
          <span className="font-mono text-[9px] text-muted-foreground">({count})</span>
        ) : undefined
      }
    >
      {isLoading && (
        <p className="text-[11px] text-muted-foreground">Querying candidate vessels…</p>
      )}
      {!isLoading && (
        <>
          <Field label="AIS candidates" value={formatCandidates(count)} />
          {topName !== '—' && (
            <>
              <Field label="Top candidate" value={topName} />
              <Field label="Match score" value={formatConfidence(topScore)} />
              {topDist != null && (
                <Field label="Distance to origin" value={`${topDist.toFixed(2)} km`} />
              )}
            </>
          )}
        </>
      )}
    </CollapsibleSection>
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
  investigationMode,
  onSetInvestigationMode,
  isForecastLoading,
  forecastError,
  forecast,
  coastline,
  onToggleFocusMode,
  onToggleBacktrack,
  onClear,
  onRecenter,
  onScrollToDetails,
  autoCollapse = false,
}: InvestigationPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Collapse the instant the reveal sequence starts (not continuously —
  // only on the false->true edge — so a manual re-expand afterward sticks).
  useEffect(() => {
    if (autoCollapse) setIsOpen(false);
  }, [autoCollapse]);

  const sourceLon = trajectory?.source?.longitude ?? spill.estimatedSourceLongitude;
  const sourceLat = trajectory?.source?.latitude ?? spill.estimatedSourceLatitude;

  // See `computeForecastAlertSeverity` — shared with `MaritimeMap.tsx`'s
  // predicted-position marker so the banner here and that marker's colour
  // never disagree.
  const coastalAlertSeverity = useMemo<AlertSeverity | null>(
    () => computeForecastAlertSeverity(forecast, coastline),
    [forecast, coastline]
  );
  const sourceRadius = trajectory?.source?.radiusKm ?? spill.estimatedSourceRadiusKm;
  const releaseTime = spill.estimatedReleaseTime
    ? formatUtcTimestamp(Date.parse(spill.estimatedReleaseTime))
    : trajectory?.points[0]
    ? formatUtcTimestamp(trajectory.points[0].timestampMs)
    : '—';

  return (
    <div
      className={`flex w-full flex-col overflow-hidden bg-background text-foreground transition-all duration-200 ${
        isOpen ? 'h-full' : 'shrink-0'
      }`}
    >
      <div className={`flex shrink-0 items-center justify-between px-3 py-2 ${isOpen ? 'border-b border-border' : ''}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex flex-1 items-center gap-1.5 min-w-0 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground cursor-pointer select-none"
          title={isOpen ? 'Collapse investigation panel' : 'Expand investigation panel'}
        >
          <Search size={13} className="text-primary shrink-0" />
          <span className="truncate">Under investigation</span>
          {isOpen ? (
            <ChevronUp size={13} className="ml-auto mr-1 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown size={13} className="ml-auto mr-1 text-muted-foreground shrink-0" />
          )}
        </button>
        <button
          type="button"
          onClick={onClear}
          title="Clear investigation"
          className="ml-1 -mr-1 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      {isOpen && (
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        <div className="maritime-panel-card flex items-center justify-between gap-2 p-2.5">
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

        {/* 1. INCIDENT */}
        <CollapsibleSection
          title="Incident"
          icon={<AlertCircle size={12} className="text-primary shrink-0" />}
        >
          <Field label="Detected" value={formatDetectedAt(spill)} />
          <Field label="Area" value={formatArea(spill.areaKm2)} />
          <Field label="Confidence" value={formatConfidence(spill.confidenceScore)} />
          <Field label="Centroid" value={formatCoordinates(spill)} />
          <Field
            label="Estimated age"
            value={spill.estimatedAgeHours != null ? `${spill.estimatedAgeHours.toFixed(1)} h` : '—'}
          />
          <Field label="Source type" value={spill.sourceType ?? '—'} />
        </CollapsibleSection>

        {/* 2. PROBABLE SOURCE */}
        {(sourceLat != null && sourceLon != null) && (
          <CollapsibleSection
            title="Probable Source"
            icon={<MapPin size={12} className="text-primary shrink-0" />}
          >
            <Field label="Coordinates" value={formatLatLon(sourceLon, sourceLat)} />
            <Field label="Uncertainty" value={formatUncertaintyRadius(sourceRadius)} />
            <Field label="Est. release" value={releaseTime} />
          </CollapsibleSection>
        )}

        {/* 3. DRIFT DIAGNOSTIC */}
        <CollapsibleSection
          title="Drift Diagnostic"
          icon={<Activity size={12} className="text-primary shrink-0" />}
          defaultOpen={true}
        >
          <DiagnosticPlotViewer
            spillId={spill.spillId}
            fallbackUrl={spill.imageUrl}
            alt={`Drift diagnostic plot for ${spill.spillId}`}
            containerClassName="aspect-[4/3] w-full"
            badgeText="Diagnostic"
          />
        </CollapsibleSection>

        {/* 4. CANDIDATE SUMMARY */}
        <CandidateSummarySection
          attribution={attribution}
          spill={spill}
          isLoading={isAttributionLoading}
        />

        {/* 5. DRIFT BACKTRACK */}
        <DriftSection
          trajectory={trajectory}
          isLoading={isTrajectoryLoading}
          error={trajectoryError}
        />

        {/* Investigation mode: Backtrack (where the oil came from, existing
            behavior, unchanged) vs Forecast (where the oil is going, new). */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onSetInvestigationMode('backtrack')}
            title="Backtrack: reconstruct where the oil came from"
            className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              investigationMode === 'backtrack'
                ? 'border-amber-500/70 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Rewind size={12} />
            Backtrack
          </button>
          <button
            type="button"
            onClick={() => onSetInvestigationMode('forecast')}
            title="Forecast: predict where the oil is going"
            className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              investigationMode === 'forecast'
                ? 'border-cyan-500/70 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <TrendingUp size={12} />
            Forecast
          </button>
        </div>

        {investigationMode === 'forecast' && (
          <>
            {isForecastLoading && (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Solving forecast…
              </p>
            )}
            {!isForecastLoading && forecastError && (
              <p className="text-[11px] text-muted-foreground">{forecastError}</p>
            )}
            {!isForecastLoading && !forecastError && coastalAlertSeverity && (
              <CoastalAlertBanner severity={coastalAlertSeverity} />
            )}
          </>
        )}

        {/* Arm / disarm investigation timeline — Backtrack-mode only: the
            timeline and Focus Mode polygon are both trajectory-driven and
            would render underneath an unrelated forecast path otherwise. */}
        <button
          type="button"
          onClick={onToggleBacktrack}
          disabled={(!trajectory && !isTrajectoryLoading) || investigationMode === 'forecast'}
          title={
            investigationMode === 'forecast'
              ? 'Investigate vessels is only available in Backtrack mode'
              : undefined
          }
          className={`flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 ${
            backtrackActive
              ? 'border-amber-500/70 bg-amber-500/20 text-amber-700 dark:text-amber-300'
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
              onClick={() => onSetPlaybackMode('backtrack')}
              title="Backtrack to Source: Detection → Origin"
              className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                playbackMode === 'backtrack'
                  ? 'border-amber-500/70 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              ◀ Backtrack
            </button>
            <button
              type="button"
              onClick={() => onSetPlaybackMode('forward')}
              title="Forward Reconstruction: Origin → Detection"
              className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                playbackMode === 'forward'
                  ? 'border-cyan-500/70 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              ▶ Forward
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
      )}
    </div>
  );
}