import React from 'react';
import { Cpu, RefreshCw, Database, Radio } from 'lucide-react';

export const SystemStatusWidget: React.FC = () => {
  return (
    <div className="flex flex-col justify-between h-full min-h-[260px] w-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 font-sans">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          System Pipeline Status
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {/* Metric 1 */}
        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Database size={16} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground font-sans">SAR Ingestion Pipeline</span>
              <span className="text-[10px] text-muted-foreground font-mono">Sentinel-1A / Sentinel-1B</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-chart-1/15 text-chart-1 border border-chart-1/30 uppercase tracking-wider font-sans">
            Active
          </span>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Cpu size={16} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground font-sans">AIS Correlation Engine</span>
              <span className="text-[10px] text-muted-foreground font-mono">Latency: 1.2s</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-chart-1/15 text-chart-1 border border-chart-1/30 uppercase tracking-wider font-sans">
            Online
          </span>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Radio size={16} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground font-sans">Next Satellite Pass</span>
              <span className="text-[10px] text-muted-foreground font-mono">Orbit ID: S1-3449</span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-foreground">
            ~42 min
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1">
          <RefreshCw size={10} className="animate-spin text-primary" />
          Last updated 12s ago
        </span>
        <span>v2.1.0-alpha</span>
      </div>
    </div>
  );
};
