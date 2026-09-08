// src/components/map/StatsHUD.tsx
import { useMemo } from 'react';
import type { SpillEvent } from '../../types/spill';

interface StatsHUDProps {
  spills: SpillEvent[];
  selectedDate: string | null;
}

export function StatsHUD({ spills, selectedDate }: StatsHUDProps) {
  const stats = useMemo(() => {
    const filtered = selectedDate
      ? spills.filter(s => s.detected_at.startsWith(selectedDate))
      : spills;

    return {
      total: filtered.length,
      totalArea: filtered.reduce((sum, s) => sum + s.area_km2, 0).toFixed(1),
      avgConf: filtered.length
        ? ((filtered.reduce((sum, s) => sum + s.confidence_score, 0) / filtered.length) * 100).toFixed(0)
        : '0',
      highRisk: filtered.filter(s => s.confidence_score >= 0.8).length,
      dates: selectedDate
        ? new Date(selectedDate).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        : `${new Set(spills.map(s => s.detected_at.split('T')[0])).size} dates`
    };
  }, [spills, selectedDate]);

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 min-w-[200px]">
        {/* Title */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-white tracking-wide">SENTINEL</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Total Spills" value={stats.total} icon="🛢️" />
          <StatBox label="Total Area" value={`${stats.totalArea}`} unit="km²" icon="📐" />
          <StatBox
            label="Avg Confidence"
            value={`${stats.avgConf}%`}
            icon="📊"
            color={
              Number(stats.avgConf) >= 80
                ? 'red'
                : Number(stats.avgConf) >= 60
                ? 'amber'
                : 'green'
            }
          />
          <StatBox
            label="High Risk"
            value={stats.highRisk}
            icon="⚠️"
            color={stats.highRisk > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Date indicator */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Period</div>
          <div className="text-sm text-slate-300 font-medium">{stats.dates}</div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  unit,
  icon,
  color = 'slate'
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color?: 'slate' | 'green' | 'amber' | 'red';
}) {
  const colorMap = {
    slate: 'text-slate-300',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400'
  };

  return (
    <div className="bg-white/5 rounded-lg p-2">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs">{icon}</span>
        <span className="text-[10px] text-slate-500 uppercase">{label}</span>
      </div>
      <div className={`text-lg font-bold ${colorMap[color]}`}>
        {value} {unit && <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}
