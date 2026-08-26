import React from 'react';
import { Canvas } from '@react-three/fiber';
import { SimulationHUD } from './SimulationHUD';
import { Maximize, ZoomIn, ZoomOut, Navigation2 } from 'lucide-react';
import { IncidentScene } from './scene/IncidentScene';

export const SimulationViewport: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#0a0f18] rounded-lg border border-slate-700 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
      
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <IncidentScene />
        </Canvas>
      </div>

      {/* HUD Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <SimulationHUD />
        
        {/* Viewport UI Controls Placeholder */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
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
    </div>
  );
};
