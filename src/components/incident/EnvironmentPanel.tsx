import React from 'react';
import { mockIncident } from '../../data/mockIncident';
import { Wind, Waves } from 'lucide-react';

export const EnvironmentPanel: React.FC = () => {
  const { environment } = mockIncident;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col shadow-lg">
      <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-300 tracking-wider">ENVIRONMENTAL CONDITIONS</h3>
      </div>
      
      <div className="p-3 grid grid-cols-2 gap-3">
        {/* Wind Card */}
        <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Wind size={14} className="text-cyan-400" />
            <span className="text-xs font-medium tracking-wider">WIND</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Direction</span>
              <span className="text-slate-200 font-mono">{environment.wind.direction}°</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Speed</span>
              <span className="text-slate-200 font-mono">{environment.wind.speed} kn</span>
            </div>
          </div>
        </div>

        {/* Current Card */}
        <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Waves size={14} className="text-cyan-400" />
            <span className="text-xs font-medium tracking-wider">CURRENT</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Direction</span>
              <span className="text-slate-200 font-mono">{environment.current.direction}°</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Speed</span>
              <span className="text-slate-200 font-mono">{environment.current.speed} kn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
