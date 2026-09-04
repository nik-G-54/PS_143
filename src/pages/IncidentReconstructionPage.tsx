import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { SimulationViewport } from '../components/incident/SimulationViewport';
import { IntelligencePanel } from '../components/incident/IntelligencePanel';
import { Timeline } from '../components/incident/Timeline';
import { EvidenceChain } from '../components/incident/EvidenceChain';
import { SimulationProvider } from '../context/SimulationContext';
import { IncidentProvider, IncidentContext } from '../context/IncidentContext';
import { Maximize2, Minimize2 } from 'lucide-react';
import { SlideInDrawer } from '../components/ui/SlideInDrawer';

// A lightweight context to handle interactions within the reconstruction page
export const InteractionContext = React.createContext<{
  selectedObject: { type: string; id: string } | null;
  setSelectedObject: (obj: { type: string; id: string } | null) => void;
  isFullscreen: boolean;
  setFullscreen: (val: boolean) => void;
  drawerContent: React.ReactNode | null;
  setDrawerContent: (content: React.ReactNode | null, title?: string) => void;
} | null>(null);

export const useInteraction = () => {
  const ctx = React.useContext(InteractionContext);
  if (!ctx) throw new Error("useInteraction must be within InteractionProvider");
  return ctx;
};

export const IncidentReconstructionPage: React.FC = () => {
  const [isFullscreen, setFullscreen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<{ type: string; id: string } | null>(null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerContent, setDrawerContent] = useState<React.ReactNode | null>(null);

  const handleSetDrawerContent = (content: React.ReactNode | null, title = 'Details') => {
    setDrawerContent(content);
    setDrawerTitle(title);
    setDrawerOpen(!!content);
  };

  const { spillDetails, vesselsData, backtrackData } = React.useContext(IncidentContext) || {};

  React.useEffect(() => {
    if (selectedObject) {
      if (selectedObject.type === 'vessel') {
        const vessel = vesselsData?.vessels?.find((v: any) => v.vessel_id === selectedObject.id);
        if (vessel) {
          handleSetDrawerContent(
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">ID: {vessel.vessel_id}</p>
              <p className="text-muted-foreground">Name: {vessel.vessel_name}</p>
              <p className="text-muted-foreground">Match: {((vessel.score ?? 0) * 100).toFixed(1)}%</p>
              <p className="text-muted-foreground">Provenance: {vessel.is_mock ? 'DEMO / MOCK' : 'LIVE AIS'}</p>
            </div>,
            "Vessel Details"
          );
        }
      } else if (selectedObject.type === 'source') {
        const sourceEst = backtrackData?.backtrack.source_estimate;
        if (sourceEst) {
          handleSetDrawerContent(
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">Lat: {sourceEst.latitude.toFixed(4)}°</p>
              <p className="text-muted-foreground">Lon: {sourceEst.longitude.toFixed(4)}°</p>
              <p className="text-muted-foreground">Radius: {sourceEst.radius_km} km</p>
            </div>,
            "Source Estimate Details"
          );
        }
      } else if (selectedObject.type === 'oil') {
        handleSetDrawerContent(
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">Status: Detected</p>
            <p className="text-muted-foreground">Area: {spillDetails?.area_km2?.toFixed(2)} km²</p>
            <p className="text-muted-foreground">Detection Confidence: {((spillDetails?.confidence_score ?? 0) * 100).toFixed(1)}%</p>
          </div>,
          "Incident Details"
        );
      }
    }
  }, [selectedObject, vesselsData, backtrackData, spillDetails]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    // don't clear content immediately to allow exit animation
    setTimeout(() => {
      setDrawerContent(null);
      setSelectedObject(null);
    }, 300);
  };

  return (
    <IncidentProvider>
      <SimulationProvider>
        <InteractionContext.Provider value={{
          selectedObject, 
          setSelectedObject, 
          isFullscreen, 
          setFullscreen,
          drawerContent,
          setDrawerContent: handleSetDrawerContent
        }}>
          <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200 relative">
            
            {!isFullscreen && <Sidebar />}

            <div className="flex flex-col flex-1 min-w-0 h-full relative">
              
              {!isFullscreen && (
                <>
                  <Header />
                  <EvidenceChain />
                </>
              )}
              
              {/* Main Workspace */}
              <main className="flex-1 min-h-0 relative overflow-hidden bg-[#010810]">
                {/* 3D Scene Area */}
                <div className={`absolute inset-0 transition-all duration-300 ${!isFullscreen ? 'lg:right-[320px]' : ''}`}>
                  <SimulationViewport />
                </div>
                
                {/* Intelligence Panel (Compact Sidebar) */}
                {!isFullscreen && (
                  <div className="absolute top-0 right-0 bottom-0 w-[320px] bg-card/80 backdrop-blur-md border-l border-border p-3 overflow-y-auto hidden lg:block z-20">
                    <IntelligencePanel />
                  </div>
                )}
                
                {/* Fullscreen toggle button */}
                <button
                  onClick={() => setFullscreen(!isFullscreen)}
                  className="absolute top-4 right-4 z-30 p-2 bg-black/40 hover:bg-black/60 text-white rounded-md backdrop-blur border border-white/10 transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <div className="flex items-center gap-2">
                      <Minimize2 size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Exit</span>
                    </div>
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </button>

              </main>
              
              <Timeline />
            </div>

            {/* Progressive Disclosure Drawer */}
            <SlideInDrawer 
              isOpen={drawerOpen} 
              onClose={closeDrawer} 
              title={drawerTitle}
            >
              {drawerContent}
            </SlideInDrawer>

          </div>
        </InteractionContext.Provider>
      </SimulationProvider>
    </IncidentProvider>
  );
};
