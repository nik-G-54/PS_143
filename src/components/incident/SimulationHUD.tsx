import React from 'react';
import { mockIncident } from '../../data/mockIncident';
import { Crosshair } from 'lucide-react';

export const SimulationHUD: React.FC = () => {
  const { id, confidence, location } = mockIncident;

  return (
    <div className="absolute top-4 left-4 p-4 border border-cyan-500/30 bg-slate-900/60 backdrop-blur-md rounded pointer-events-none flex flex-col gap-3 min-w-[200px]">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <span className="text-xs text-slate-400 font-mono tracking-widest">INCIDENT</span>
        <span className="text-cyan-400 font-mono font-bold">{id}</span>
      </div>
      
      <div>
        <div className="text-red-400 text-sm font-bold flex items-center gap-2 mb-1">
          <Crosshair size={14} />
          OIL SPILL DETECTED
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-slate-400">CONFIDENCE</span>
          <span className="text-white font-mono">{confidence}%</span>
        </div>
      </div>

      <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 mt-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">LAT</span>
          <span className="text-slate-200 font-mono">{location.lat}° N</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">LON</span>
          <span className="text-slate-200 font-mono">{location.lng}° E</span>
        </div>
        <div className="flex justify-between text-xs mt-2 pt-1 border-t border-slate-700/50">
          <span className="text-slate-500">REGION</span>
          <span className="text-slate-300 font-semibold">{location.name.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
