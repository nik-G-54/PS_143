import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PanelBottom } from 'lucide-react';
import { BacktrackTrajectoryChart } from './BacktrackTrajectoryChart';
import { SatelliteImageryPanel } from './SatelliteImageryPanel';
import { Timeline } from './Timeline';

export const IncidentAnalysisDock: React.FC = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="shrink-0 border-t border-border bg-background z-20 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <PanelBottom size={13} className="text-primary" />
          <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Analysis · Trajectory & Satellite
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-transparent hover:border-border"
        >
          {expanded ? 'Collapse' : 'Expand'}
          {expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,1fr)] gap-3 p-3 min-h-[320px] h-[360px]">
          <BacktrackTrajectoryChart />
          <SatelliteImageryPanel />
        </div>
      )}

      <div className="sticky bottom-0 z-10">
        <Timeline />
      </div>
    </div>
  );
};
