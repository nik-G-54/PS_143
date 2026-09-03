import { Trash2 } from 'lucide-react';
import type { ScanHistoryItem } from '../../types/image-analysis';

interface Props {
  history: ScanHistoryItem[];
  onClear: () => void;
}

export function ScanHistory({ history, onClear }: Props) {
  if (!Array.isArray(history) || history.length === 0) return null;

  function handleClearClick() {
    try {
      onClear();
    } catch (err) {
      console.error('[ScanHistory] Failed to clear history:', err);
    }
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--card)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-[var(--font-sans)] text-[var(--fg)]">
          Scan History ({history.length})
        </h3>
        <button
          onClick={handleClearClick}
          className="p-1 rounded hover:bg-[var(--fg)]/10 transition-colors cursor-pointer"
          title="Clear scan history"
        >
          <Trash2 className="w-3.5 h-3.5 text-[var(--fg)]/40" />
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.map((item, idx) => {
          let confPercent = 0;
          try {
            confPercent = Math.min(100, Math.max(0, Math.round((item.confidence || 0) * 100)));
          } catch (err) {
            console.error('[ScanHistory] Error calculating confidence for item:', item, err);
          }

          return (
            <div
              key={item.id || `history-${idx}`}
              className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg)]"
            >
              <img
                src={item.thumbnail_url}
                alt="Scan Thumbnail"
                className="w-10 h-10 rounded object-cover flex-shrink-0 bg-[var(--card)]"
                onError={(e) => {
                  try {
                    // Fallback visual on thumbnail load error
                    (e.target as HTMLImageElement).style.display = 'none';
                  } catch (err) {
                    console.error('[ScanHistory] Error in thumbnail onError fallback:', err);
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.is_oil_spill ? 'var(--brand)' : 'var(--alert)' }}
                  />
                  <span className="text-xs font-[var(--font-sans)] text-[var(--fg)]/70 truncate">
                    {item.is_oil_spill ? 'Oil Spill' : 'No Spill'}
                  </span>
                </div>
                <p className="text-xs font-[var(--font-mono)] text-[var(--fg)]/40">
                  {confPercent}%
                  {item.area_km2 ? ` • ${item.area_km2} km²` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
