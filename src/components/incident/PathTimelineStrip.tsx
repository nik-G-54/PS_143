import React, { useMemo } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { computeTrajectoryStats, TrajectoryMilestone } from '../../utils/trajectoryStats';

interface PathTimelineStripProps {
  activeHours?: number | null;
}

export const PathTimelineStrip: React.FC<PathTimelineStripProps> = ({ activeHours }) => {
  const { backtrackData } = useIncident();
  const stats = useMemo(
    () => computeTrajectoryStats(backtrackData?.backtrack.trajectory, 5),
    [backtrackData]
  );

  if (!stats || stats.milestones.length === 0) return null;

  const milestones = stats.milestones;

  return (
    <div className="pointer-events-none w-full max-w-3xl mx-auto">
      <div className="rounded-lg bg-slate-950/75 border border-white/10 backdrop-blur-md px-3 py-2 shadow-lg">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span className="text-[9px] font-bold tracking-[0.16em] text-amber-400">
            BACKTRACK PATH
          </span>
          <span className="text-[10px] font-mono text-slate-300">
            {stats.totalDistanceKm.toFixed(1)} km · {stats.durationLabel}
          </span>
        </div>

        <div className="relative flex items-center gap-0">
          <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-px bg-amber-500/35" />
          <div className="relative z-10 flex justify-between w-full gap-1">
            {milestones.map((m) => (
              <MilestoneChip key={`${m.index}-${m.timestamp}`} m={m} activeHours={activeHours} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function MilestoneChip({
  m,
  activeHours,
}: {
  m: TrajectoryMilestone;
  activeHours?: number | null;
}) {
  const isNear =
    activeHours != null && Math.abs(activeHours - m.hoursFromStart) < Math.max(statsWindow(m), 1.2);

  const tone = m.isStart
    ? 'border-emerald-400/50 text-emerald-300 bg-emerald-950/80'
    : m.isEnd
      ? 'border-red-400/50 text-red-300 bg-red-950/80'
      : isNear
        ? 'border-amber-300/70 text-amber-100 bg-amber-900/80 scale-105'
        : 'border-amber-500/35 text-amber-200/90 bg-slate-950/80';

  return (
    <div
      className={`flex flex-col items-center px-1.5 py-1 rounded border min-w-0 ${tone} transition-transform`}
    >
      <span className="text-[8px] font-bold tracking-wider whitespace-nowrap">
        {m.isStart ? 'RELEASE' : m.isEnd ? 'OBS' : m.label}
      </span>
      <span className="text-[8px] font-mono text-slate-300 whitespace-nowrap">{m.timeLabel}</span>
      <span className="text-[7px] font-mono text-slate-500">{m.distanceFromStartKm.toFixed(1)} km</span>
    </div>
  );
}

function statsWindow(m: TrajectoryMilestone) {
  return m.isStart || m.isEnd ? 0.8 : 1.5;
}
