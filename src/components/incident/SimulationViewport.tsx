import React from 'react';
import { Canvas } from '@react-three/fiber';
import { SimulationHUD } from './SimulationHUD';
import { Maximize, ZoomIn, ZoomOut, Navigation2 } from 'lucide-react';
import { IncidentScene } from './scene/IncidentScene';

export const SimulationViewport: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-card rounded-lg border border-border overflow-hidden shadow-inner">
      
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <IncidentScene />
        </Canvas>
      </div>

      {/* HUD Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <SimulationHUD />
        
        {/* Viewport UI Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
          <button className="p-2 bg-card/90 border border-border hover:border-primary rounded text-foreground transition-colors shadow-sm">
            <Navigation2 size={18} />
          </button>
          <button className="p-2 bg-card/90 border border-border hover:border-primary rounded text-foreground transition-colors shadow-sm">
            <ZoomIn size={18} />
          </button>
          <button className="p-2 bg-card/90 border border-border hover:border-primary rounded text-foreground transition-colors shadow-sm">
            <ZoomOut size={18} />
          </button>
          <button className="p-2 bg-card/90 border border-border hover:border-primary rounded text-foreground transition-colors shadow-sm mt-2">
            <Maximize size={18} />
          </button>
        </div>

        {/* Corner Markers */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40 m-4 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40 m-4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40 m-4 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 m-4 pointer-events-none" />
      </div>
    </div>
  );
};
