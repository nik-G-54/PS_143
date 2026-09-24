import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Layers, Loader2, Waves, Wind } from 'lucide-react';
import type { OceanFlowStatus } from '../hooks/useOceanFlow';
import type { SpillEnvironment } from '../types/trajectoryTypes';

interface MapLayersControlProps {
  oceanFlow: {
    visible: boolean;
    status: OceanFlowStatus;
    error: string | null;
    onToggle: () => void;
    onRetry: () => void;
  };
  /** Per-spill wind/current vectors — null hides those two rows. */
  environment: SpillEnvironment | null;
  showWind: boolean;
  showCurrent: boolean;
  onToggleWind: () => void;
  onToggleCurrent: () => void;
}

function Switch({ on }: { on: boolean }) {
  return (
    <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-border'}`}>
      <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-card shadow transition-transform ${on ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
    </span>
  );
}

function Row({
  icon,
  label,
  detail,
  on,
  onClick,
  disabled,
  title,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent disabled:cursor-wait disabled:opacity-70"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {detail && <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{detail}</span>}
      <Switch on={on} />
    </button>
  );
}

/**
 * Environmental overlays (ambient wind/current flow, and the selected spill's
 * wind/current vectors) behind a single "Layers" button at the map's
 * bottom-left — the usual home for map-layer toggles, and out of the top bar
 * so it stays about detections and the investigation.
 */
export function MapLayersControl({
  oceanFlow,
  environment,
  showWind,
  showCurrent,
  onToggleWind,
  onToggleCurrent,
}: MapLayersControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const flowLoading = oceanFlow.status === 'loading';
  const flowError = oceanFlow.status === 'error';
  const activeCount = [oceanFlow.visible && !flowError, showWind, showCurrent].filter(Boolean).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div className="animate-slide-in absolute bottom-full left-0 mb-2 w-60 rounded-lg border border-border bg-card p-1.5 shadow-lg">
          <p className="px-2 pb-1 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Environment</p>
          <Row
            icon={flowLoading ? <Loader2 size={14} className="animate-spin" /> : flowError ? <AlertTriangle size={14} /> : <Waves size={14} />}
            label={flowError ? 'Retry wind & current flow' : 'Wind & current flow'}
            on={oceanFlow.visible && !flowError}
            disabled={flowLoading}
            title={flowError && oceanFlow.error ? oceanFlow.error : 'Animated regional wind and surface-current field'}
            onClick={flowError ? oceanFlow.onRetry : oceanFlow.onToggle}
          />
          {environment?.wind && (
            <Row
              icon={<Wind size={14} />}
              label="Wind at spill"
              detail={`${environment.wind.speed.toFixed(1)} ${environment.wind.unit}`}
              on={showWind}
              onClick={onToggleWind}
            />
          )}
          {environment?.current && (
            <Row
              icon={<Waves size={14} />}
              label="Current at spill"
              detail={`${environment.current.speed.toFixed(2)} ${environment.current.unit}`}
              on={showCurrent}
              onClick={onToggleCurrent}
            />
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold shadow-md transition-colors hover:bg-accent ${
          open ? 'text-primary' : 'text-foreground'
        }`}
        title="Map layers"
      >
        <Layers size={15} />
        Layers
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>
    </div>
  );
}
