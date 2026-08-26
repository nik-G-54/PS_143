import React from 'react';
import { SimulationHUD } from './SimulationHUD';
import { Maximize, ZoomIn, ZoomOut, Navigation2 } from 'lucide-react';
import { mockIncident } from '../../data/mockIncident';

export const SimulationViewport: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#0a0f18] rounded-lg border border-slate-700 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
      {/* Decorative Technical Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0891b2 1px, transparent 1px),
            linear-gradient(to bottom, #0891b2 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <div className="w-96 h-96 rounded-full border border-cyan-500" />
        <div className="absolute w-64 h-64 rounded-full border border-cyan-500" />
        <div className="absolute w-px h-full bg-cyan-500" />
        <div className="absolute h-px w-full bg-cyan-500" />
      </div>

      {/* Placeholder Text */}
      <div className="z-10 text-center flex flex-col items-center gap-4">
        <div className="text-cyan-500/50 flex flex-col items-center">
          <h2 className="text-2xl font-bold tracking-[0.2em] mb-2 text-cyan-400">3D INCIDENT SCENE</h2>
          <p className="text-slate-400 tracking-widest">{mockIncident.location.name.toUpperCase()}</p>
          <p className="text-slate-500 font-mono mt-1">INCIDENT {mockIncident.id}</p>
        </div>
        <div className="px-4 py-2 border border-slate-700 bg-slate-800/50 rounded text-slate-400 text-sm mt-4">
          Simulation viewport — 3D engine will be integrated in Phase 2
        </div>
      </div>

      <SimulationHUD />

      {/* Viewport UI Controls Placeholder */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button className="p-2 bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 rounded text-slate-300 transition-colors">
          <Navigation2 size={18} />
        </button>
        <button className="p-2 bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 rounded text-slate-300 transition-colors">
          <ZoomIn size={18} />
        </button>
        <button className="p-2 bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 rounded text-slate-300 transition-colors">
          <ZoomOut size={18} />
        </button>
        <button className="p-2 bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 rounded text-slate-300 transition-colors mt-2">
          <Maximize size={18} />
        </button>
      </div>

      {/* Corner Markers */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/30 m-4 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30 m-4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/30 m-4 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30 m-4 pointer-events-none" />
    </div>
  );
};
