import { AlertTriangle, Globe2, Loader2, RotateCcw } from 'lucide-react';

interface SpillStatusBadgeProps {
  spillCount: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onResetView: () => void;
}

/** Dataset readout: how many detections are on the map, plus a way back to the globe. */
export function SpillStatusBadge({
  spillCount,
  isLoading,
  error,
  onRetry,
  onResetView,
}: SpillStatusBadgeProps) {
  return (
    <div className="absolute top-16 left-4 z-10 flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-2 text-xs font-medium shadow-md backdrop-blur-md">
        {isLoading && (
          <>
            <Loader2 size={13} className="animate-spin text-primary" />
            <span className="text-muted-foreground">Loading detections…</span>
          </>
        )}

        {!isLoading && error && (
          <>
            <AlertTriangle size={13} className="text-destructive" />
            <span className="text-muted-foreground">{error}</span>
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-accent"
            >
              Retry
            </button>
          </>
        )}

        {!isLoading && !error && (
          <>
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
            <span className="font-mono tabular-nums text-foreground">{spillCount}</span>
            <span className="text-muted-foreground">detected oil spills</span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onResetView}
        title="Back to globe view"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card/90 px-2.5 py-2 text-xs font-medium text-foreground shadow-md backdrop-blur-md transition-colors hover:bg-accent"
      >
        <Globe2 size={13} />
        <span className="hidden sm:inline">Globe</span>
      </button>

      {!isLoading && !error && spillCount > 0 && (
        <button
          type="button"
          onClick={onRetry}
          title="Reload detections"
          className="flex items-center rounded-lg border border-border bg-card/90 p-2 text-muted-foreground shadow-md backdrop-blur-md transition-colors hover:bg-accent hover:text-foreground"
        >
          <RotateCcw size={13} />
        </button>
      )}
    </div>
  );
}
