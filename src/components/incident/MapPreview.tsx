import React from 'react';
import { mockIncident } from '../../data/mockIncident';
import { Map as MapIcon } from 'lucide-react';

export const MapPreview: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col shadow-lg h-full">
      <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 tracking-wider flex items-center gap-2">
          <MapIcon size={14} className="text-cyan-400" />
          2D MAP
        </h3>
        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase tracking-widest">Phase 9</span>
      </div>
      
      <div className="flex-1 p-4 flex items-center justify-center relative overflow-hidden bg-[#0c1322]">
        {/* Abstract Map Graphic */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at center, #0891b2 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        <div className="text-center z-10">
          <h4 className="text-slate-400 text-sm font-semibold tracking-widest mb-1">{mockIncident.location.name.toUpperCase()}</h4>
          <p className="text-slate-500 text-xs">Map integration coming in Phase 9</p>
        </div>
      </div>
    </div>
  );
};
