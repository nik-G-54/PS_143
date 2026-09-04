import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SimulationHUD } from './SimulationHUD';
import { ViewportControls } from './scene/ViewportControls';
import { ZoomIn, ZoomOut, Navigation2 } from 'lucide-react';
import { IncidentScene } from './scene/IncidentScene';
import { useSceneLayers } from '../../context/SceneLayersContext';
import { useViewportCamera } from '../../context/ViewportCameraContext';

export const SimulationViewport: React.FC = () => {
  const { layers } = useSceneLayers();
  const { api } = useViewportCamera();

  return (
    <div className="relative w-full h-full bg-[#0a4f86] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas
          dpr={layers.lite ? [1, 1] : [1, 2]}
          gl={{
            antialias: !layers.lite,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.12,
          }}
          scene={{
            background: new THREE.Color('#1477b8'),
            fog: new THREE.FogExp2('#1a7ec4', 0.0018),
          }}
        >
          <IncidentScene />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <SimulationHUD />
        <div className="pointer-events-auto">
          <ViewportControls />
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
          <button
            type="button"
            title="Reset camera"
            onClick={() => api?.reset()}
            className="p-2 bg-card/90 border border-border hover:border-primary rounded text-foreground transition-colors shadow-sm"
          >
            <Navigation2 size={18} />
          </button>
          <button
            type="button"
            title="Zoom in"
            onClick={() => api?.zoomIn()}
            className="p-2 bg-card/90 border border-border hover:border-primary rounded text-foreground transition-colors shadow-sm"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            title="Zoom out"
            onClick={() => api?.zoomOut()}
            className="p-2 bg-card/90 border border-border hover:border-primary rounded text-foreground transition-colors shadow-sm"
          >
            <ZoomOut size={18} />
          </button>
        </div>

        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40 m-4 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40 m-4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40 m-4 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 m-4 pointer-events-none" />
      </div>
    </div>
  );
};
