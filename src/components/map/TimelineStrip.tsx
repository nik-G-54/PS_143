// src/components/map/TimelineStrip.tsx
import { useMemo } from 'react';
import type { SpillEvent } from '../../types/spill';

interface TimelineStripProps {
  dates: string[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  spills: SpillEvent[];
}

export function TimelineStrip({ dates, selectedDate, onDateSelect, spills }: TimelineStripProps) {
  // Count spills per date
  const dateStats = useMemo(() => {
    const stats: Record<string, { count: number; maxConf: number; totalArea: number }> = {};
    dates.forEach(date => {
      const daySpills = spills.filter(s => s.detected_at.startsWith(date));
      stats[date] = {
        count: daySpills.length,
        maxConf: daySpills.length ? Math.max(...daySpills.map(s => s.confidence_score)) : 0,
        totalArea: daySpills.reduce((sum, s) => sum + s.area_km2, 0)
      };
    });
    return stats;
  }, [dates, spills]);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    };
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
      <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Detection Timeline
          </span>
          {selectedDate && (
            <button
              onClick={() => onDateSelect(null)}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Timeline Bar */}
        <div className="flex items-end gap-2 h-20 overflow-x-auto pb-1">
          {dates.map((date) => {
            const stats = dateStats[date];
            if (!stats) return null;
            const { day, date: dateStr } = formatDate(date);
            const isSelected = date === selectedDate;
            const height = Math.max(20, Math.min(100, (stats.count / 20) * 100));

            return (
              <button
                key={date}
                onClick={() => onDateSelect(isSelected ? null : date)}
                className={`
                  flex-1 min-w-[50px] flex flex-col items-center gap-1 group transition-all duration-200
                  ${isSelected ? 'scale-105' : 'hover:scale-102'}
                `}
              >
                {/* Bar */}
                <div
                  className={`
                    w-full rounded-t-md transition-all duration-200
                    ${
                      isSelected
                        ? 'bg-gradient-to-t from-red-600 to-cyan-500 shadow-lg shadow-cyan-500/30'
                        : 'bg-gradient-to-t from-red-900/50 to-red-600/70 group-hover:from-red-800/70 group-hover:to-red-500/90'
                    }
                  `}
                  style={{ height: `${height}%` }}
                >
                  {/* Count badge */}
                  <div
                    className={`
                      -mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold mx-auto w-fit
                      ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }
                    `}
                  >
                    {stats.count}
                  </div>
                </div>

                {/* Label */}
                <div className="text-center">
                  <div
                    className={`
                      text-[10px] font-medium
                      ${isSelected ? 'text-cyan-400' : 'text-slate-500'}
                    `}
                  >
                    {day}
                  </div>
                  <div
                    className={`
                      text-xs font-bold
                      ${isSelected ? 'text-white' : 'text-slate-400'}
                    `}
                  >
                    {dateStr}
                  </div>
                </div>

                {/* Area indicator */}
                <div className="text-[9px] text-slate-500">
                  {stats.totalArea.toFixed(1)} km²
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          <span className="text-[10px] text-slate-500">Confidence:</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-[10px] text-slate-400">{'< 60%'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-slate-400">60-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-slate-400">{'> 80%'}</span>
          </div>
          <span className="text-[10px] text-slate-500 ml-4">Area ∝ marker size</span>
        </div>
      </div>
    </div>
  );
}
