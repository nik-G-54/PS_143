// src/components/dashboard/DashboardHeader.tsx

import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';

export const DashboardHeader: React.FC = () => {
  const { filteredSpills, spills, isLoading } = useDashboardContext();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/40 font-sans">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
          <Clock size={12} className="text-primary" />
          <span>2019 INCIDENT ANALYTICS · ALL TIMES UTC</span>
        </div>
        <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
          <Activity size={22} className="text-primary" />
          <span>Maritime Oil Spill Analytics</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground bg-card/60 px-3 py-1.5 rounded-lg border border-border shrink-0 self-start sm:self-auto">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>
          {isLoading
            ? 'Fetching Spills...'
            : `Showing ${filteredSpills.length} of ${spills.length} events`}
        </span>
      </div>
    </div>
  );
};
