import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SimulationHUD } from './SimulationHUD';
import { ViewportControls } from './scene/ViewportControls';
import { OceanControlsPanel } from './scene/OceanControlsPanel';
import { ZoomIn, ZoomOut, Navigation2 } from 'lucide-react';
import { IncidentScene } from './scene/IncidentScene';
import { useSceneLayers } from '../../context/SceneLayersContext';
import { useViewportCamera } from '../../context/ViewportCameraContext';

export const SimulationViewport: React.FC = () => {
  const { layers } = useSceneLayers();
  const { api } = useViewportCamera();

  const bg = layers.night ? '#020814' : '#0b5f9e';
  const fogColor = layers.night ? '#06101f' : '#1578b5';
  const fogDensity = layers.night ? 0.0011 : 0.0007;
  const exposure = layers.night ? 0.72 : 1.18;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: bg }}>
      <div className="absolute inset-0 z-0">
        <Canvas
          key={layers.night ? 'night' : 'day'}
          dpr={layers.lite ? [1, 1] : [1, 2]}
          gl={{
            antialias: !layers.lite,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: exposure,
          }}
          scene={{
            background: new THREE.Color(bg),
            fog: new THREE.FogExp2(fogColor, fogDensity),
          }}
        >
          <IncidentScene />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <SimulationHUD />
        <ViewportControls />
        <OceanControlsPanel />

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
      </div>
    </div>
  );
};
