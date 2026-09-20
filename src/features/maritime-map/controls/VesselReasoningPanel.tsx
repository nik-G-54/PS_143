import { CheckCircle2, ShieldQuestion, XCircle } from 'lucide-react';
import type { AttributedVessel, SpillAttribution } from '../types/attributionTypes';

interface VesselReasoningPanelProps {
  vessel: AttributedVessel;
  attribution: SpillAttribution | null;
}

/** null = "unknown" (backend didn't report the field this check needs) rather than a hard pass/fail. */
type CheckState = 'pass' | 'fail' | 'unknown';

interface ReasoningCheck {
  label: string;
  state: CheckState;
  detail: string;
}

function formatPercent(value: number | null): string {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}

function formatKm(value: number | null): string {
  if (value == null) return '—';
  return `${value.toFixed(value < 10 ? 2 : 1)} km`;
}

function formatHours(value: number | null): string {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}h`;
}

function buildChecks(vessel: AttributedVessel, attribution: SpillAttribution | null): ReasoningCheck[] {
  const search = attribution?.searchParameters ?? null;

  const corridorState: CheckState =
    attribution?.candidateWithinCorridor == null ? 'unknown' : attribution.candidateWithinCorridor ? 'pass' : 'fail';
  const corridorRadius = search?.candidateSearchCorridorRadiusKm;

  const radiusState: CheckState =
    attribution?.withinBacktrackRadius == null ? 'unknown' : attribution.withinBacktrackRadius ? 'pass' : 'fail';
  const driftRadius = search?.driftUncertaintyRadiusKm;

  const windowHours = search?.temporalWindowHours;
  const windowState: CheckState =
    vessel.timeDifferenceHours == null || windowHours == null
      ? 'unknown'
      : Math.abs(vessel.timeDifferenceHours) <= windowHours
        ? 'pass'
        : 'fail';

  return [
    {
      label: 'Within transit search corridor',
      state: corridorState,
      detail:
        vessel.distanceFromOriginKm != null
          ? `${formatKm(vessel.distanceFromOriginKm)} away${corridorRadius != null ? ` · corridor ${formatKm(corridorRadius)}` : ''}`
          : '—',
    },
    {
      label: 'Within drift-uncertainty radius',
      state: radiusState,
      detail:
        driftRadius != null
          ? `Origin estimate ± ${formatKm(driftRadius)}`
          : 'Tight origin estimate, wide corridor — a candidate can clear one and miss the other.',
    },
    {
      label: 'Inside release-time window',
      state: windowState,
      detail:
        windowHours != null
          ? `${formatHours(vessel.timeDifferenceHours)} offset · window ± ${windowHours}h`
          : formatHours(vessel.timeDifferenceHours),
    },
  ];
}

const CHECK_ICON: Record<CheckState, typeof CheckCircle2> = {
  pass: CheckCircle2,
  fail: XCircle,
  unknown: ShieldQuestion,
};

const CHECK_COLOR: Record<CheckState, string> = {
  pass: 'text-green-600 dark:text-green-400',
  fail: 'text-amber-600 dark:text-amber-400',
  unknown: 'text-muted-foreground',
};

/**
 * Replaces `InvestigationPanel` in the same top-right slot for the duration
 * of the vessel-reveal sequence (see `MaritimeMap.tsx` — both are keyed off
 * `vesselReveal.stage !== 'idle'`, one collapsing exactly as the other
 * appears) — the "why is this vessel rank #1" breakdown the reveal's ship
 * card has no room for. Every value here is read straight off
 * `AttributedVessel`/`SpillAttribution` — see `vesselAdapter.ts` — none of
 * it is recomputed on the frontend; ranking and scoring stay backend-owned.
 */
export function VesselReasoningPanel({ vessel, attribution }: VesselReasoningPanelProps) {
  const checks = buildChecks(vessel, attribution);

  return (
    <div className="animate-slide-in flex min-h-0 w-full flex-1 flex-col overflow-hidden border-t-2 border-t-amber-500/40 bg-background text-foreground">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-3 py-2">
        <ShieldQuestion size={13} className="shrink-0 text-amber-500" />
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Why rank #1
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-2.5 text-[11px]">
        <div className="maritime-panel-card p-2.5">
          <p className="truncate font-mono text-[12px] font-semibold text-primary">{vessel.vesselName}</p>
          <p className="text-[10px] text-muted-foreground">
            Score {formatPercent(vessel.score)} · Correlation {formatPercent(vessel.trajectoryCorrelation)}
          </p>
        </div>

        <div className="maritime-panel-card space-y-2 p-2.5">
          {checks.map((check, index) => {
            const Icon = CHECK_ICON[check.state];
            return (
              <div
                key={check.label}
                className="maritime-reasoning-row flex items-start gap-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Icon size={14} className={`mt-0.5 shrink-0 ${CHECK_COLOR[check.state]}`} />
                <div className="min-w-0">
                  <p className="text-foreground">{check.label}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{check.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {attribution?.attributionQualification && (
          <p className="maritime-panel-card p-2.5 leading-relaxed text-muted-foreground">
            {attribution.attributionQualification}
          </p>
        )}
      </div>
    </div>
  );
}
