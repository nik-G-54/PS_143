import React from 'react';
import { Globe } from 'lucide-react';

export const GlobePreview: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col shadow-lg h-full">
      <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 tracking-wider flex items-center gap-2">
          <Globe size={14} className="text-cyan-400" />
          GLOBE
        </h3>
        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase tracking-widest">Phase 9</span>
      </div>
      
      <div className="flex-1 p-4 flex items-center justify-center relative overflow-hidden bg-[#0c1322]">
        <div className="w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border border-cyan-500/10 scale-110" />
          <Globe size={32} className="text-cyan-600/50" />
        </div>
        <div className="absolute bottom-4 text-center z-10 w-full">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest">Globe integration pending</p>
        </div>
      </div>
    </div>
  );
};
