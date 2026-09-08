import { Clock, Trash2, History } from 'lucide-react';
import type { ScanHistoryItem } from '../types/image-analysis';

interface Props {
  history: ScanHistoryItem[];
  onSelectScan: (item: ScanHistoryItem) => void;
  onClear: () => void;
  activeScanId?: string;
}

function formatGroupDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}`;
  } catch {
    return 'Previous';
  }
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return '08:29';
  }
}

export function ScanHistory({ history, onSelectScan, onClear, activeScanId }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="h-full rounded-2xl p-6 bg-card border border-border/80 shadow-sm flex flex-col items-center justify-center text-center font-sans">
        <div className="w-12 h-12 rounded-xl bg-accent/60 border border-border flex items-center justify-center text-muted-foreground mb-4">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-foreground font-mono mb-1 uppercase tracking-wider">
          SCAN HISTORY
        </h3>
        <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed mb-2 font-sans">
          Your analysed images will appear here.
        </p>
        <span className="text-[11px] font-mono text-muted-foreground/60 italic">
          No scans yet
        </span>
      </div>
    );
  }

  // Group history items by date label
  const groups: { [key: string]: ScanHistoryItem[] } = {};
  history.forEach(item => {
    const groupKey = formatGroupDate(item.analyzed_at);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
  });

  return (
    <div className="h-full rounded-2xl p-5 bg-card border border-border/80 shadow-sm flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold font-mono text-foreground tracking-wider uppercase">
            SCAN HISTORY
          </h3>
        </div>
        <button
          onClick={onClear}
          title="Clear all scan history"
          className="text-xs text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable Grouped History List */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 font-mono text-xs">
        {Object.entries(groups).map(([groupTitle, items]) => (
          <div key={groupTitle} className="space-y-2">
            <h4 className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider px-1">
              {groupTitle}
            </h4>

            <div className="space-y-2">
              {items.map(item => {
                const isActive = item.id === activeScanId;
                const isReal = item.is_oil_spill;
                const peakPct = Math.round((item.peak_confidence || 0) * 100);
                const regionsCount = item.total_spills || 1;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectScan(item)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isActive
                        ? 'bg-accent/80 border-primary shadow-sm'
                        : 'bg-accent/20 border-border/60 hover:border-primary/40 hover:bg-accent/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isReal ? 'bg-destructive animate-pulse' : 'bg-emerald-500'}`} />
                        <span className={`font-bold truncate text-[11px] uppercase tracking-wide ${isReal ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isReal ? 'OIL SPILL DETECTED' : 'NO OIL SPILL'}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTime(item.analyzed_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span>
                        {peakPct}% {isReal ? `· ${regionsCount} region${regionsCount > 1 ? 's' : ''}` : ''}
                      </span>
                      <span className="truncate max-w-[100px] text-muted-foreground/60 text-[10px]" title={item.file_name}>
                        {item.file_name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
