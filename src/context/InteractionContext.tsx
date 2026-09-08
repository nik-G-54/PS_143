import React, { useState } from 'react';

export type InteractionState = {
  selectedObject: { type: string; id: string } | null;
  setSelectedObject: (obj: { type: string; id: string } | null) => void;
  isFullscreen: boolean;
  setFullscreen: (value: boolean) => void;
  drawerContent: React.ReactNode | null;
  setDrawerContent: (content: React.ReactNode | null, title?: string) => void;
};

export const InteractionContext = React.createContext<InteractionState | null>(null);

export const useInteraction = () => {
  const context = React.useContext(InteractionContext);
  if (!context) throw new Error('useInteraction must be within InteractionProvider');
  return context;
};

export const InteractionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [selectedObject, setSelectedObject] = useState<InteractionState['selectedObject']>(null);
  const [isFullscreen, setFullscreen] = useState(false);
  const [drawerContent, setDrawerContentState] = useState<React.ReactNode | null>(null);

  const setDrawerContent = (content: React.ReactNode | null) => setDrawerContentState(content);

  return (
    <InteractionContext.Provider
      value={{
        selectedObject,
        setSelectedObject,
        isFullscreen,
        setFullscreen,
        drawerContent,
        setDrawerContent,
      }}
    >
      {children}
    </InteractionContext.Provider>
  );
};
