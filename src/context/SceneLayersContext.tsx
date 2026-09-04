import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface SceneLayersState {
  oil: boolean;
  source: boolean;
  ais: boolean;
  wind: boolean;
  current: boolean;
  grid: boolean;
  lite: boolean;
}

export type SceneLayerKey = keyof SceneLayersState;

function preferLiteOcean(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === 'number' && memory <= 4) return true;
  return false;
}

const DEFAULT_LAYERS: SceneLayersState = {
  oil: true,
  source: true,
  ais: true,
  wind: true,
  current: true,
  grid: false,
  lite: preferLiteOcean(),
};

interface SceneLayersContextValue {
  layers: SceneLayersState;
  toggleLayer: (key: SceneLayerKey) => void;
}

const SceneLayersContext = createContext<SceneLayersContextValue | undefined>(undefined);

export const SceneLayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layers, setLayers] = useState<SceneLayersState>(DEFAULT_LAYERS);

  const toggleLayer = useCallback((key: SceneLayerKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const value = useMemo(() => ({ layers, toggleLayer }), [layers, toggleLayer]);

  return (
    <SceneLayersContext.Provider value={value}>
      {children}
    </SceneLayersContext.Provider>
  );
};

export function useSceneLayers() {
  const ctx = useContext(SceneLayersContext);
  if (!ctx) throw new Error('useSceneLayers must be used within SceneLayersProvider');
  return ctx;
}
