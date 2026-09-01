// src/components/dashboard/SystemStatusWidget.tsx

import React from 'react';
import { Cpu, RefreshCw, Database, Radio } from 'lucide-react';

export const SystemStatusWidget: React.FC = () => {
  return (
    <div className="flex flex-col justify-between h-full min-h-[260px] w-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          System Pipeline Status
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {/* Metric 1 */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151F33]/50 rounded-lg border border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center gap-3">
            <Database size={16} className="text-[#0EA5E9] dark:text-[#00D9A6]" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">SAR Ingestion Pipeline</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Sentinel-1A / Sentinel-1B</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Active
          </span>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151F33]/50 rounded-lg border border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center gap-3">
            <Cpu size={16} className="text-[#0EA5E9] dark:text-[#00D9A6]" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">AIS Correlation Engine</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Latency: 1.2s</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Online
          </span>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151F33]/50 rounded-lg border border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center gap-3">
            <Radio size={16} className="text-amber-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Next Satellite Pass</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Orbit ID: S1-3449</span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
            ~42 min
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F0F0F0] dark:border-[#252830] flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <RefreshCw size={10} className="animate-spin" />
          Last updated 12s ago
        </span>
        <span>v2.1.0-alpha</span>
      </div>
    </div>
  );
};
