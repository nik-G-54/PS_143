import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  FileSearch,
  Globe2,
  Image as ImageIcon,
  Info,
  Loader2,
  Map as MapIcon,
  PanelRightClose,
  PanelRightOpen,
  Radar,
  RotateCcw,
  Satellite,
  Ship,
  Waves,
  Wind,
} from 'lucide-react';
import type { BasemapMode } from '../map/mapConfig';
import type { OceanFlowStatus } from '../hooks/useOceanFlow';
import type { SpillEnvironment } from '../types/trajectoryTypes';

export type RightSidebarModule = 'investigation' | 'incident' | 'image' | 'vessels' | 'time';

export const RIGHT_SIDEBAR_MODULES: {
  id: RightSidebarModule;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: 'investigation', label: 'Investigation', icon: <Radar size={18} strokeWidth={1.5} /> },
  { id: 'incident', label: 'Incident details', icon: <Info size={18} strokeWidth={1.5} /> },
  { id: 'image', label: 'Image', icon: <ImageIcon size={18} strokeWidth={1.5} /> },
  { id: 'vessels', label: 'Vessel details', icon: <Ship size={18} strokeWidth={1.5} /> },
  { id: 'time', label: 'Time & drift', icon: <Clock size={18} strokeWidth={1.5} /> },
];

const COLLAPSED_STORAGE_KEY = 'maritime-map.right-rail.collapsed';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(value));
  } catch {
    // Storage blocked (private mode etc.) — the rail just won't remember its width.
  }
}

type ActiveTone = 'primary' | 'wind' | 'current';

const ACTIVE_TONE: Record<ActiveTone, string> = {
  primary: 'maritime-primary-tint text-primary',
  wind: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  current: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
};

interface RailItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick: () => void;
  active?: boolean;
  tone?: ActiveTone;
  /** Short trailing value shown only while expanded (e.g. wind speed). */
  detail?: string;
  disabled?: boolean;
  danger?: boolean;
  /** Small amber attention dot. */
  dot?: boolean;
  title?: string;
}

function RailItem({
  icon,
  label,
  collapsed,
  onClick,
  active = false,
  tone = 'primary',
  detail,
  disabled = false,
  danger = false,
  dot = false,
  title,
}: RailItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      aria-pressed={active}
      className={`relative flex items-center rounded-md transition-colors disabled:cursor-wait disabled:opacity-70 ${
        collapsed ? 'mx-auto h-10 w-10 justify-center' : 'h-9 w-full gap-2.5 px-2.5'
      } ${
        active
          ? ACTIVE_TONE[tone]
          : danger
            ? 'text-destructive hover:bg-accent'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {active && <span className="absolute -left-2 top-2 bottom-2 w-0.5 rounded-full bg-current" />}
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">{label}</span>
          {detail && (
            <span className="shrink-0 font-mono text-[10px] tabular-nums opacity-80">{detail}</span>
          )}
        </>
      )}
      {dot && !active && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />}
    </button>
  );
}

function RailSection({
  label,
  collapsed,
  first = false,
  children,
}: {
  label: string;
  collapsed: boolean;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      {collapsed ? (
        !first && <div className="mx-auto my-1.5 h-px w-6 bg-border" />
      ) : (
        <p className="px-2.5 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

/** Detection count readout — not a button; reload lives in its own rail item. */
function DetectionStatus({
  collapsed,
  count,
  isLoading,
  error,
}: {
  collapsed: boolean;
  count: number;
  isLoading: boolean;
  error: string | null;
}) {
  const title = isLoading ? 'Loading detections…' : error ? error : `${count} detected oil spills`;
  const icon = isLoading ? (
    <Loader2 size={16} className="animate-spin text-primary" />
  ) : error ? (
    <AlertTriangle size={16} className="text-destructive" />
  ) : (
    <span className="block h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
  );

  if (collapsed) {
    return (
      <div title={title} className="mx-auto flex h-10 w-10 flex-col items-center justify-center gap-0.5">
        {icon}
        {!isLoading && !error && (
          <span className="font-mono text-[9px] font-semibold tabular-nums leading-none text-foreground">
            {count}
          </span>
        )}
      </div>
    );
  }

  return (
    <div title={title} className="flex h-9 items-center gap-2.5 px-2.5 text-xs">
      <span className="flex w-[18px] shrink-0 justify-center">{icon}</span>
      {isLoading ? (
        <span className="text-muted-foreground">Loading detections…</span>
      ) : error ? (
        <span className="truncate text-destructive">Detections unavailable</span>
      ) : (
        <span className="truncate">
          <span className="font-mono font-semibold tabular-nums text-foreground">{count}</span>{' '}
          <span className="text-muted-foreground">detected spills</span>
        </span>
      )}
    </div>
  );
}

interface MapRightSidebarProps {
  basemapMode: BasemapMode;
  onSelectBasemap: (mode: BasemapMode) => void;
  spillCount: number;
  isSpillsLoading: boolean;
  spillsError: string | null;
  onReloadSpills: () => void;
  onResetView: () => void;
  oceanFlow: {
    visible: boolean;
    status: OceanFlowStatus;
    error: string | null;
    onToggle: () => void;
    onRetry: () => void;
  };
  /** Per-spill wind/current vectors — null hides the Wind/Current items. */
  environment: SpillEnvironment | null;
  showWind: boolean;
  showCurrent: boolean;
  onToggleWind: () => void;
  onToggleCurrent: () => void;

  /** Whether a spill is selected — investigation modules only exist then. */
  hasSelection: boolean;
  /** Open module, or null when only the rail is showing. */
  activeModule: RightSidebarModule | null;
  onSelectModule: (module: RightSidebarModule | null) => void;
  onClearInvestigation: () => void;
  /** Modules whose icon should carry an attention dot (e.g. vessels during the reveal). */
  highlighted?: Partial<Record<RightSidebarModule, boolean>>;
  /** Renders the body of the open module. */
  renderModule: (module: RightSidebarModule) => React.ReactNode;
  /**
   * Reports how much of the map's right edge the rail + open module cover
   * (px, including the 1rem outer margin), so bottom overlays such as the
   * investigation timeline can stop short of it instead of sliding under it.
   */
  onOccupiedWidthChange?: (px: number) => void;
  /** Evidence dossier state — opens the full-screen dossier with the map docked beside it. */
  evidenceOpen?: boolean;
  onOpenEvidence?: () => void;
}

/**
 * Right-hand rail, mirroring the app's left `Sidebar`: every map control
 * (basemap, globe reset, detection reload, wind/current layers) plus the
 * investigation modules once a spill is selected. Expanded it shows icon +
 * label; collapsed it shrinks to an icon-only strip (remembered per browser).
 * Floats over the map's right edge so the map always keeps its full width.
 * Each module icon opens its card beside the rail; the card's edge chevron
 * (or the same icon again) closes it.
 */
export function MapRightSidebar({
  basemapMode,
  onSelectBasemap,
  spillCount,
  isSpillsLoading,
  spillsError,
  onReloadSpills,
  onResetView,
  oceanFlow,
  environment,
  showWind,
  showCurrent,
  onToggleWind,
  onToggleCurrent,
  hasSelection,
  activeModule,
  onSelectModule,
  onClearInvestigation,
  highlighted,
  renderModule,
  onOccupiedWidthChange,
  evidenceOpen = false,
  onOpenEvidence,
}: MapRightSidebarProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !onOccupiedWidthChange) return;
    const report = () => {
      const parent = el.offsetParent as HTMLElement | null;
      const rect = el.getBoundingClientRect();
      const parentRight = parent ? parent.getBoundingClientRect().right : window.innerWidth;
      onOccupiedWidthChange(Math.max(0, Math.round(parentRight - rect.left)));
    };
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onOccupiedWidthChange]);
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      writeCollapsed(!prev);
      return !prev;
    });
  };

  const active = hasSelection ? (RIGHT_SIDEBAR_MODULES.find((m) => m.id === activeModule) ?? null) : null;

  const flowLoading = oceanFlow.status === 'loading';
  const flowError = oceanFlow.status === 'error';

  return (
    <div ref={rootRef} className="maritime-right-sidebar flex flex-row items-start gap-4">
      {active && (
        <div className="relative flex max-h-full min-h-0 flex-col">
          <button
            type="button"
            onClick={() => onSelectModule(null)}
            title={`Close ${active.label}`}
            aria-label={`Close ${active.label}`}
            className="absolute -left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:scale-105 hover:bg-accent hover:text-foreground active:scale-95"
          >
            <ChevronRight size={13} strokeWidth={2.5} />
          </button>

          <div className="maritime-right-module animate-slide-in flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-lg backdrop-blur-md">
            <div className="flex shrink-0 items-center gap-2 border-b border-border py-2.5 pl-5 pr-3 text-primary">
              {active.icon}
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {active.label}
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">{renderModule(active.id)}</div>
          </div>
        </div>
      )}

      <nav
        aria-label="Map controls"
        className={`relative flex max-h-full shrink-0 flex-col rounded-lg border border-border bg-card shadow-lg backdrop-blur-md transition-[width] duration-300 select-none ${
          collapsed ? 'w-[56px]' : 'w-[208px]'
        }`}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand controls' : 'Collapse controls'}
          aria-label={collapsed ? 'Expand controls' : 'Collapse controls'}
          className="absolute -left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:scale-105 hover:bg-accent hover:text-foreground active:scale-95"
        >
          {collapsed ? <ChevronLeft size={13} strokeWidth={2.5} /> : <ChevronRight size={13} strokeWidth={2.5} />}
        </button>

        <div className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-2 ${collapsed ? 'px-1.5' : 'px-2'}`}>
          <RailSection label="Detections" collapsed={collapsed} first>
            <DetectionStatus
              collapsed={collapsed}
              count={spillCount}
              isLoading={isSpillsLoading}
              error={spillsError}
            />
            <RailItem
              icon={<RotateCcw size={18} strokeWidth={1.5} />}
              label={spillsError ? 'Retry' : 'Reload detections'}
              collapsed={collapsed}
              onClick={onReloadSpills}
              disabled={isSpillsLoading}
              danger={Boolean(spillsError)}
            />
            <RailItem
              icon={<Globe2 size={18} strokeWidth={1.5} />}
              label="Globe view"
              title="Back to globe view"
              collapsed={collapsed}
              onClick={onResetView}
            />
          </RailSection>

          <RailSection label="Basemap" collapsed={collapsed}>
            <RailItem
              icon={<Satellite size={18} strokeWidth={1.5} />}
              label="Satellite"
              collapsed={collapsed}
              active={basemapMode === 'satellite'}
              onClick={() => onSelectBasemap('satellite')}
            />
            <RailItem
              icon={<MapIcon size={18} strokeWidth={1.5} />}
              label="Standard"
              collapsed={collapsed}
              active={basemapMode === 'standard'}
              onClick={() => onSelectBasemap('standard')}
            />
          </RailSection>

          <RailSection label="Layers" collapsed={collapsed}>
            <RailItem
              icon={
                flowLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : flowError ? (
                  <AlertTriangle size={18} strokeWidth={1.5} />
                ) : (
                  <span className="relative block h-[18px] w-[18px]">
                    <Wind size={13} strokeWidth={1.75} className="absolute left-0 top-0" />
                    <Waves size={13} strokeWidth={1.75} className="absolute bottom-0 right-0" />
                  </span>
                )
              }
              label={flowLoading ? 'Loading flow…' : flowError ? 'Retry wind & current' : 'Wind & Current'}
              title={
                flowError && oceanFlow.error
                  ? oceanFlow.error
                  : oceanFlow.visible
                    ? 'Hide wind & current flow'
                    : 'Show wind & current flow'
              }
              collapsed={collapsed}
              active={oceanFlow.visible && !flowError}
              tone="wind"
              danger={flowError}
              disabled={flowLoading}
              onClick={flowError ? oceanFlow.onRetry : oceanFlow.onToggle}
            />
            {environment?.wind && (
              <RailItem
                icon={<Wind size={18} strokeWidth={1.5} />}
                label="Wind"
                detail={`${environment.wind.speed.toFixed(1)} ${environment.wind.unit}`}
                title={`Wind ${environment.wind.speed.toFixed(1)} ${environment.wind.unit}`}
                collapsed={collapsed}
                active={showWind}
                tone="wind"
                onClick={onToggleWind}
              />
            )}
            {environment?.current && (
              <RailItem
                icon={<Waves size={18} strokeWidth={1.5} />}
                label="Current"
                detail={`${environment.current.speed.toFixed(2)} ${environment.current.unit}`}
                title={`Current ${environment.current.speed.toFixed(2)} ${environment.current.unit}`}
                collapsed={collapsed}
                active={showCurrent}
                tone="current"
                onClick={onToggleCurrent}
              />
            )}
          </RailSection>

          {hasSelection && (
            <RailSection label="Investigation" collapsed={collapsed}>
              {RIGHT_SIDEBAR_MODULES.map((module) => {
                const isActive = module.id === activeModule;
                return (
                  <RailItem
                    key={module.id}
                    icon={module.icon}
                    label={module.label}
                    collapsed={collapsed}
                    active={isActive}
                    dot={highlighted?.[module.id]}
                    onClick={() => onSelectModule(isActive ? null : module.id)}
                  />
                );
              })}
              {onOpenEvidence && (
                <RailItem
                  icon={<FileSearch size={18} strokeWidth={1.5} />}
                  label="Evidence dossier"
                  title="Open the full evidence dossier"
                  collapsed={collapsed}
                  active={evidenceOpen}
                  onClick={onOpenEvidence}
                />
              )}
              <RailItem
                icon={<Eraser size={18} strokeWidth={1.5} />}
                label="Clear investigation"
                collapsed={collapsed}
                onClick={onClearInvestigation}
              />
            </RailSection>
          )}
        </div>

        <div className={`shrink-0 border-t border-border py-1.5 ${collapsed ? 'px-1.5' : 'px-2'}`}>
          <RailItem
            icon={
              collapsed ? (
                <PanelRightOpen size={18} strokeWidth={1.5} />
              ) : (
                <PanelRightClose size={18} strokeWidth={1.5} />
              )
            }
            label={collapsed ? 'Expand' : 'Collapse'}
            title={collapsed ? 'Expand controls' : 'Collapse controls'}
            collapsed={collapsed}
            onClick={toggleCollapsed}
          />
        </div>
      </nav>
    </div>
  );
}
