import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import { mockIncident } from '../../data/mockIncident';

export const Header: React.FC = () => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 text-slate-300">
      <div className="flex items-center gap-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Activity size={18} className="text-cyan-400" />
          3D INCIDENT RECONSTRUCTION
        </h2>
        <div className="h-4 w-px bg-slate-700"></div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Incident:</span>
          <span className="font-mono text-cyan-400">{mockIncident.id}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-950/30 border border-red-900/50 rounded-full text-red-400">
          <ShieldAlert size={14} />
          <span className="font-semibold text-xs tracking-wider">{mockIncident.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">System Online</span>
        </div>
      </div>
    </header>
  );
};
