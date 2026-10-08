import { useMemo } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Crosshair,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Rewind,
  RotateCw,
  Send,
  TrendingUp,
} from 'lucide-react';
import type { AlertPhase } from '../alerts/alertSendState';
import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory } from '../types/trajectoryTypes';
import type { SpillForecast } from '../types/forecastTypes';
import type { InvestigationMode } from '../deck/deckLayers';
import {
  type AlertSeverity,
  type CoastlineGeoJSON,
  computeForecastAlertSeverity,
} from '../utils/coastalAlert';

interface InvestigationPanelProps {
  spill: MapSpill;
  focusMode: boolean;
  trajectory: SpillTrajectory | null;
  isTrajectoryLoading: boolean;
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
  onRecenter: () => void;
  onScrollToDetails: () => void;
  /** Send state for this spill's drill alert (see `alerts/alertSendState.ts`). */
  alertPhase: AlertPhase;
  /** True when the alert log already holds a successful alert for this spill. */
  alerted: boolean;
  onOpenAlert: () => void;
}

/** Banner background per severity — the whole point is to be readable at a glance. */
const COASTAL_ALERT_STYLES: Record<AlertSeverity, string> = {
  monitor: 'border-green-500/70 bg-green-500/15 text-green-700 dark:text-green-300',
  advisory: 'border-yellow-500/70 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
  watch: 'border-orange-500/70 bg-orange-500/15 text-orange-700 dark:text-orange-300',
  critical: 'border-red-500/70 bg-red-500/15 text-red-700 dark:text-red-300',
};

/**
 * How urgently the predicted landfall should read. Nothing is sent from here:
 * `critical`/`watch` only point at the Send Alert button, which previews and
 * then sends an explicit drill alert.
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
          Use “Send drill alert” below to notify the nearest station.
        </div>
      )}
    </div>
  );
}

const ALERT_BUTTON_LABEL: Record<AlertPhase, string> = {
  idle: 'Send drill alert',
  sending: 'Sending…',
  sent: 'Alert sent',
  failed: 'Failed — retry',
};

const ALERT_BUTTON_TONE: Record<AlertPhase, string> = {
  idle: 'border-border bg-card text-foreground hover:bg-accent',
  sending: 'border-border bg-muted text-muted-foreground',
  sent: 'border-green-600/50 bg-green-600/10 text-green-800 dark:text-green-300',
  failed: 'border-red-500/60 bg-red-500/10 text-red-800 dark:text-red-300',
};

const ACTION_BUTTON =
  'flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors';
const ACTION_IDLE = 'border-border text-muted-foreground hover:bg-accent hover:text-foreground';

/**
 * The "Investigation" module of the right sidebar — every action that drives
 * the map (backtrack / forecast mode, vessel investigation playback, focus
 * mode, evidence jump) lives here in one place. Descriptive data lives in the
 * sidebar's other modules (see `sidebarModules.tsx`).
 */
export function InvestigationPanel({
  spill,
  focusMode,
  trajectory,
  isTrajectoryLoading,
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
  onRecenter,
  onScrollToDetails,
  alertPhase,
  alerted,
  onOpenAlert,
}: InvestigationPanelProps) {
  // See `computeForecastAlertSeverity` — shared with `MaritimeMap.tsx`'s
  // predicted-position marker so the banner here and that marker's colour
  // never disagree.
  const coastalAlertSeverity = useMemo<AlertSeverity | null>(
    () => computeForecastAlertSeverity(forecast, coastline),
    [forecast, coastline]
  );

  return (
    <>
      <div className="maritime-panel-card flex items-center justify-between gap-2 p-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-sm font-semibold text-primary">{spill.spillId}</span>
          {alerted && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-600/40 bg-green-600/10 py-0.5 pl-1.5 pr-2 text-[10.5px] font-semibold text-green-800 dark:text-green-300"
              title="A drill alert for this spill is in the alert log"
            >
              <Check size={10} strokeWidth={3} />
              Alert sent
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onRecenter}
          title="Frame this spill and its drift path"
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Crosshair size={13} />
        </button>
      </div>

      {/* Investigation mode: Backtrack (where the oil came from) vs
          Forecast (where the oil is going). */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onSetInvestigationMode('backtrack')}
          title="Backtrack: reconstruct where the oil came from"
          className={`${ACTION_BUTTON} ${
            investigationMode === 'backtrack'
              ? 'border-amber-500/70 bg-amber-500/15 text-amber-700 dark:text-amber-300'
              : ACTION_IDLE
          }`}
        >
          <Rewind size={12} />
          Backtrack
        </button>
        <button
          type="button"
          onClick={() => onSetInvestigationMode('forecast')}
          title="Forecast: predict where the oil is going"
          className={`${ACTION_BUTTON} ${
            investigationMode === 'forecast'
              ? 'border-cyan-500/70 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
              : ACTION_IDLE
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
        className={`${ACTION_BUTTON} disabled:opacity-40 ${
          backtrackActive
            ? 'border-amber-500/70 bg-amber-500/20 text-amber-700 dark:text-amber-300'
            : ACTION_IDLE
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
                : ACTION_IDLE
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
                : ACTION_IDLE
            }`}
          >
            ▶ Forward
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onToggleFocusMode}
        className={`${ACTION_BUTTON} ${
          focusMode ? 'border-primary bg-primary text-primary-foreground' : ACTION_IDLE
        }`}
      >
        {focusMode ? <EyeOff size={13} /> : <Eye size={13} />}
        {focusMode ? 'Focus mode on' : 'Focus mode'}
      </button>

      <button type="button" onClick={onScrollToDetails} className={`${ACTION_BUTTON} ${ACTION_IDLE}`}>
        Open evidence dossier
      </button>

      <div className="mt-1 border-t border-border pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Notify</p>
        <button
          type="button"
          onClick={onOpenAlert}
          disabled={alertPhase === 'sending'}
          title="Preview a drill alert to the nearest coast guard station"
          className={`flex h-11 w-full items-center gap-2.5 rounded-lg border px-3.5 text-left text-[13px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${ALERT_BUTTON_TONE[alertPhase]}`}
        >
          {alertPhase === 'sending' ? (
            <Loader2 size={15} className="shrink-0 animate-spin" />
          ) : alertPhase === 'sent' ? (
            <Check size={15} className="shrink-0" />
          ) : alertPhase === 'failed' ? (
            <RotateCw size={15} className="shrink-0" />
          ) : (
            <Send size={15} className="shrink-0 text-primary" />
          )}
          <span className="flex-1">{ALERT_BUTTON_LABEL[alertPhase]}</span>
          {alertPhase === 'idle' && <ChevronRight size={14} className="shrink-0 text-muted-foreground" />}
        </button>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Opens a preview first{alerted ? '. An alert for this spill is already in the log.' : '. Nothing is sent until you confirm.'}
        </p>
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        {focusMode ? 'Other detections hidden.' : 'Other detections dimmed for spatial context.'}
      </p>
    </>
  );
}
