import { AlertTriangle, Loader2, Wind, Waves } from 'lucide-react';
import type { OceanFlowStatus } from '../hooks/useOceanFlow';

interface OceanFlowToggleButtonProps {
  visible: boolean;
  status: OceanFlowStatus;
  error: string | null;
  onToggle: () => void;
  onRetry: () => void;
}

/**
 * Click-toggled wind + ocean-current particle overlay control. Lazy: the
 * first click is what triggers the fetch (see useOceanFlow.ts) — this button
 * only reflects that hook's state, never fetches anything itself.
 */
export function OceanFlowToggleButton({ visible, status, error, onToggle, onRetry }: OceanFlowToggleButtonProps) {
  const isLoading = status === 'loading';
  const isError = status === 'error';

  return (
    <div className="flex flex-col items-start gap-1.5">
      {visible && status === 'ready' && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground shadow-md backdrop-blur-md">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full bg-sky-400" />
            Wind
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full bg-teal-400" />
            Current
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={isError ? onRetry : onToggle}
        disabled={isLoading}
        title={isError ? 'Retry loading wind & current data' : visible ? 'Hide wind & current' : 'Show wind & current'}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold shadow-md backdrop-blur-md transition-colors ${
          isError
            ? 'border-destructive/50 bg-card text-destructive hover:bg-accent'
            : visible
              ? 'border-sky-500/60 bg-sky-500/90 text-white'
              : 'border-border bg-card text-foreground hover:bg-accent'
        } ${isLoading ? 'cursor-wait opacity-80' : ''}`}
      >
        {isLoading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : isError ? (
          <AlertTriangle size={13} />
        ) : (
          <span className="flex items-center -space-x-0.5">
            <Wind size={13} />
            <Waves size={13} />
          </span>
        )}
        <span className="hidden sm:inline">
          {isLoading ? 'Loading wind & current…' : isError ? 'Retry wind & current' : 'Wind & Current'}
        </span>
      </button>

      {isError && error && (
        <span className="max-w-[220px] rounded-md border border-destructive/40 bg-card px-2 py-1 text-[10px] text-destructive shadow-md backdrop-blur-md">
          {error}
        </span>
      )}
    </div>
  );
}
