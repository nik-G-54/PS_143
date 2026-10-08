import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  Bell,
  ChevronUp,
  Clock,
  Eraser,
  FileDown,
  FileSearch,
  Globe2,
  Image as ImageIcon,
  Info,
  Loader2,
  Map as MapIcon,
  PanelTopClose,
  PanelTopOpen,
  Radar,
  RotateCcw,
  Satellite,
  Ship,
} from 'lucide-react';
import type { BasemapMode } from '../map/mapConfig';

export type TopBarModule = 'investigation' | 'incident' | 'image' | 'vessels' | 'time' | 'alerts';

export const TOP_BAR_MODULES: { id: TopBarModule; label: string; icon: React.ReactNode }[] = [
  { id: 'investigation', label: 'Investigation', icon: <Radar size={16} strokeWidth={1.75} /> },
  { id: 'incident', label: 'Incident details', icon: <Info size={16} strokeWidth={1.75} /> },
  { id: 'image', label: 'Image', icon: <ImageIcon size={16} strokeWidth={1.75} /> },
  { id: 'vessels', label: 'Vessel details', icon: <Ship size={16} strokeWidth={1.75} /> },
  { id: 'time', label: 'Time & drift', icon: <Clock size={16} strokeWidth={1.75} /> },
  { id: 'alerts', label: 'Alert log', icon: <Bell size={16} strokeWidth={1.75} /> },
];

const COMPACT_STORAGE_KEY = 'maritime-map.top-bar.compact';

function readCompact(): boolean {
  try {
    return window.localStorage.getItem(COMPACT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeCompact(value: boolean) {
  try {
    window.localStorage.setItem(COMPACT_STORAGE_KEY, String(value));
  } catch {
    // Storage blocked — the bar just won't remember its mode.
  }
}

type Tone = 'primary';

const ACTIVE_TONE: Record<Tone, string> = {
  primary: 'maritime-primary-tint text-primary',
};

interface ToolProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  /** Show the text label next to the icon (hidden in compact mode). */
  showLabel?: boolean;
  active?: boolean;
  tone?: Tone;
  disabled?: boolean;
  danger?: boolean;
  dot?: boolean;
  title?: string;
}

function Tool({
  icon,
  label,
  onClick,
  showLabel = false,
  active = false,
  tone = 'primary',
  disabled = false,
  danger = false,
  dot = false,
  title,
}: ToolProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      aria-pressed={active}
      className={`relative flex h-8 shrink-0 items-center gap-1.5 rounded-md text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-70 ${
        showLabel ? 'px-2.5' : 'w-8 justify-center'
      } ${
        active
          ? ACTIVE_TONE[tone]
          : danger
            ? 'text-destructive hover:bg-accent'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {icon}
      {showLabel && <span className="whitespace-nowrap">{label}</span>}
      {dot && !active && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500" />}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />;
}

interface MapTopBarProps {
  basemapMode: BasemapMode;
  onSelectBasemap: (mode: BasemapMode) => void;
  spillCount: number;
  isSpillsLoading: boolean;
  spillsError: string | null;
  onReloadSpills: () => void;
  onResetView: () => void;

  /** Whether a spill is selected — investigation tools only exist then. */
  hasSelection: boolean;
  activeModule: TopBarModule | null;
  onSelectModule: (module: TopBarModule | null) => void;
  onClearInvestigation: () => void;
  highlighted?: Partial<Record<TopBarModule, boolean>>;
  renderModule: (module: TopBarModule) => React.ReactNode;
  /**
   * Px of the map's right edge covered by the open module card (0 when none
   * is open), so bottom overlays such as the timeline stop short of it.
   */
  onOccupiedWidthChange?: (px: number) => void;
  evidenceOpen?: boolean;
  onOpenEvidence?: () => void;
  /** Downloads the PDF evidence report (instant when prepared in the background). */
  onDownloadReport?: () => void;
  /** Hover/focus on Report — tells background preparation the report is likely wanted. */
  onReportIntent?: () => void;
  reportBusy?: boolean;
  reportReady?: boolean;
  /** What an in-progress report is waiting on, e.g. "Fetching AIS tracks". */
  reportStepLabel?: string | null;
  /** "Nearest coast guard" layer toggle (line, label and station markers together). Omit to hide the button. */
  nearestGuardVisible?: boolean;
  onToggleNearestGuard?: () => void;
}

/**
 * Map toolbar floating along the top edge: detections, basemap and —
 * once a spill is selected — the investigation modules and evidence dossier.
 * Grouped left→right in the order an analyst uses them. Compact mode drops
 * the text labels to icons only (remembered per browser). A module opens as
 * a card dropping down beneath the bar on the right.
 */
export function MapTopBar({
  basemapMode,
  onSelectBasemap,
  spillCount,
  isSpillsLoading,
  spillsError,
  onReloadSpills,
  onResetView,
  hasSelection,
  activeModule,
  onSelectModule,
  onClearInvestigation,
  highlighted,
  renderModule,
  onOccupiedWidthChange,
  evidenceOpen = false,
  onOpenEvidence,
  onDownloadReport,
  onReportIntent,
  reportBusy = false,
  reportReady = false,
  reportStepLabel = null,
  nearestGuardVisible = true,
  onToggleNearestGuard,
}: MapTopBarProps) {
  const [compact, setCompact] = useState(readCompact);
  const toggleCompact = () =>
    setCompact((prev) => {
      writeCompact(!prev);
      return !prev;
    });

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const active = hasSelection ? (TOP_BAR_MODULES.find((m) => m.id === activeModule) ?? null) : null;

  useEffect(() => {
    if (!onOccupiedWidthChange) return;
    const panel = panelRef.current;
    const root = rootRef.current;
    if (!panel || !root) {
      onOccupiedWidthChange(0);
      return;
    }
    const report = () => {
      const parent = root.offsetParent as HTMLElement | null;
      const right = parent ? parent.getBoundingClientRect().right : window.innerWidth;
      onOccupiedWidthChange(Math.max(0, Math.round(right - panel.getBoundingClientRect().left)));
    };
    report();
    const observer = new ResizeObserver(report);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [active, onOccupiedWidthChange]);

  const labels = !compact;

  return (
    <div ref={rootRef} className="maritime-top-bar">
      <nav
        aria-label="Map controls"
        className="maritime-no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card px-2.5 py-1.5 shadow-lg select-none"
      >
        {/* Detections */}
        <span
          className="flex h-8 shrink-0 items-center gap-2 px-2 text-xs"
          title={isSpillsLoading ? 'Loading detections…' : spillsError ?? `${spillCount} detected oil spills`}
        >
          {isSpillsLoading ? (
            <Loader2 size={14} className="animate-spin text-primary" />
          ) : spillsError ? (
            <AlertTriangle size={14} className="text-destructive" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
          )}
          {!isSpillsLoading && !spillsError && (
            <span className="whitespace-nowrap">
              <span className="font-mono font-semibold tabular-nums text-foreground">{spillCount}</span>
              {labels && <span className="text-muted-foreground"> detected spills</span>}
            </span>
          )}
        </span>
        <Tool
          icon={<RotateCcw size={15} strokeWidth={1.75} />}
          label={spillsError ? 'Retry' : 'Reload detections'}
          onClick={onReloadSpills}
          disabled={isSpillsLoading}
          danger={Boolean(spillsError)}
        />
        <Tool icon={<Globe2 size={15} strokeWidth={1.75} />} label="Globe view" title="Back to globe view" onClick={onResetView} />

        <Divider />

        {/* Basemap */}
        <div className="flex shrink-0 items-center rounded-lg bg-muted p-0.5" role="group" aria-label="Basemap">
          {(
            [
              ['satellite', 'Satellite', <Satellite key="s" size={14} strokeWidth={1.75} />],
              ['standard', 'Standard', <MapIcon key="m" size={14} strokeWidth={1.75} />],
            ] as const
          ).map(([mode, label, icon]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSelectBasemap(mode)}
              aria-pressed={basemapMode === mode}
              title={`${label} basemap`}
              className={`flex h-7 items-center gap-1.5 rounded-md text-xs font-medium transition-colors ${labels ? 'px-2.5' : 'w-7 justify-center'} ${
                basemapMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {icon}
              {labels && label}
            </button>
          ))}
        </div>

        {/* Layer toggles */}
        {onToggleNearestGuard && (
          <Tool
            icon={<Anchor size={15} strokeWidth={1.75} />}
            label="Nearest coast guard"
            title={
              nearestGuardVisible
                ? 'Hide the nearest coast guard line, label and station markers'
                : 'Show the nearest coast guard line, label and station markers'
            }
            showLabel={labels}
            active={nearestGuardVisible}
            onClick={onToggleNearestGuard}
          />
        )}

        {hasSelection && (
          <>
            <Divider />
            {/* Investigation modules — icons, with the open one labelled */}
            {TOP_BAR_MODULES.map((module) => {
              const isActive = module.id === activeModule;
              return (
                <Tool
                  key={module.id}
                  icon={module.icon}
                  label={module.label}
                  showLabel={labels && isActive}
                  active={isActive}
                  dot={highlighted?.[module.id]}
                  onClick={() => onSelectModule(isActive ? null : module.id)}
                />
              );
            })}
            {onOpenEvidence && (
              <button
                type="button"
                onClick={onOpenEvidence}
                aria-pressed={evidenceOpen}
                title="Open the full evidence dossier"
                className={`ml-1 flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 ${
                  labels ? 'px-3' : 'w-8 justify-center'
                }`}
              >
                <FileSearch size={15} strokeWidth={1.9} />
                {labels && 'Evidence'}
              </button>
            )}
            {onDownloadReport && (
              <span className="relative flex" onPointerEnter={onReportIntent} onFocus={onReportIntent}>
                <Tool
                  icon={reportBusy ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} strokeWidth={1.75} />}
                  label={reportBusy ? (reportStepLabel ?? 'Preparing report…') : 'Report'}
                  title={
                    reportBusy
                      ? `${reportStepLabel ?? 'Preparing report'} — keep working, it downloads when ready`
                      : reportReady
                        ? 'Report ready — instant PDF download'
                        : 'Download the PDF evidence report'
                  }
                  showLabel={labels}
                  onClick={onDownloadReport}
                />
                {reportReady && !reportBusy && (
                  <span className="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                )}
              </span>
            )}
            <Tool icon={<Eraser size={15} strokeWidth={1.75} />} label="Clear investigation" onClick={onClearInvestigation} />
          </>
        )}

        <Divider />
        <Tool
          icon={compact ? <PanelTopOpen size={15} strokeWidth={1.75} /> : <PanelTopClose size={15} strokeWidth={1.75} />}
          label={compact ? 'Show labels' : 'Compact toolbar'}
          onClick={toggleCompact}
        />
      </nav>

      {active && (
        <div
          ref={panelRef}
          className="maritime-top-module animate-slide-in flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-lg"
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5 text-primary">
            {active.icon}
            <span className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {active.label}
            </span>
            <button
              type="button"
              onClick={() => onSelectModule(null)}
              title={`Close ${active.label}`}
              aria-label={`Close ${active.label}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all hover:scale-105 hover:bg-accent hover:text-foreground active:scale-95"
            >
              <ChevronUp size={13} strokeWidth={2.5} />
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">{renderModule(active.id)}</div>
        </div>
      )}
    </div>
  );
}
