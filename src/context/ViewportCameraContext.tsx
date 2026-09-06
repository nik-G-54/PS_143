import React, { createContext, useContext, useMemo, useState } from 'react';

export interface ViewportCameraApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

interface ViewportCameraContextValue {
  api: ViewportCameraApi | null;
  setApi: (api: ViewportCameraApi | null) => void;
}

const ViewportCameraContext = createContext<ViewportCameraContextValue | undefined>(undefined);

export const ViewportCameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [api, setApi] = useState<ViewportCameraApi | null>(null);
  const value = useMemo(() => ({ api, setApi }), [api]);

  return (
    <ViewportCameraContext.Provider value={value}>
      {children}
    </ViewportCameraContext.Provider>
  );
};

export function useViewportCamera() {
  const ctx = useContext(ViewportCameraContext);
  if (!ctx) throw new Error('useViewportCamera must be used within ViewportCameraProvider');
  return ctx;
}
