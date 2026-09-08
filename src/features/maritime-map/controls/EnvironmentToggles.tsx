import { Wind, Waves } from 'lucide-react';
import type { SpillEnvironment } from '../types/trajectoryTypes';

interface EnvironmentTogglesProps {
  environment: SpillEnvironment | null;
  showWind: boolean;
  showCurrent: boolean;
  onToggleWind: () => void;
  onToggleCurrent: () => void;
}

/**
 * Optional wind / current layer toggles.
 * Hidden entirely when the visualization response has no environment vectors.
 */
export function EnvironmentToggles({
  environment,
  showWind,
  showCurrent,
  onToggleWind,
  onToggleCurrent,
}: EnvironmentTogglesProps) {
  if (!environment) return null;

  const windLabel = environment.wind
    ? `${environment.wind.speed.toFixed(1)} ${environment.wind.unit}`
    : null;
  const currentLabel = environment.current
    ? `${environment.current.speed.toFixed(2)} ${environment.current.unit}`
    : null;

  return (
    <div className="absolute bottom-28 left-4 z-10 flex flex-col gap-1.5">
      {environment.wind && (
        <button
          type="button"
          onClick={onToggleWind}
          title={windLabel ? `Wind ${windLabel}` : 'Wind'}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider shadow-md backdrop-blur-md transition-colors ${
            showWind
              ? 'border-sky-500/60 bg-sky-500/90 text-white'
              : 'border-border bg-card/92 text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          <Wind size={13} />
          Wind
          {windLabel && (
            <span className="font-mono text-[10px] font-normal normal-case tracking-normal opacity-90">
              {windLabel}
            </span>
          )}
        </button>
      )}
      {environment.current && (
        <button
          type="button"
          onClick={onToggleCurrent}
          title={currentLabel ? `Current ${currentLabel}` : 'Current'}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider shadow-md backdrop-blur-md transition-colors ${
            showCurrent
              ? 'border-cyan-500/60 bg-cyan-500/90 text-white'
              : 'border-border bg-card/92 text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          <Waves size={13} />
          Current
          {currentLabel && (
            <span className="font-mono text-[10px] font-normal normal-case tracking-normal opacity-90">
              {currentLabel}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
