import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { SimulationViewport } from '../components/incident/SimulationViewport';
import { IntelligencePanel } from '../components/incident/IntelligencePanel';
import { EvidenceChain } from '../components/incident/EvidenceChain';
import { IncidentAnalysisDock } from '../components/incident/IncidentAnalysisDock';
import { SimulationProvider } from '../context/SimulationContext';
import { IncidentProvider, useIncident } from '../context/IncidentContext';
import { SceneLayersProvider } from '../context/SceneLayersContext';
import { OceanControlsProvider } from '../context/OceanControlsContext';
import { ViewportCameraProvider } from '../context/ViewportCameraContext';
import { Maximize2, Minimize2, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { SlideInDrawer } from '../components/ui/SlideInDrawer';

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
  if (!ctx) throw new Error('useInteraction must be within InteractionProvider');
  return ctx;
};

const ReconstructionWorkspace: React.FC = () => {
  const [isFullscreen, setFullscreen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(true);
  const [selectedObject, setSelectedObject] = useState<{ type: string; id: string } | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerContent, setDrawerContent] = useState<React.ReactNode | null>(null);

  const { spillDetails, vesselsData, backtrackData } = useIncident();

  const handleSetDrawerContent = (content: React.ReactNode | null, title = 'Details') => {
    setDrawerContent(content);
    setDrawerTitle(title);
    setDrawerOpen(!!content);
  };

  React.useEffect(() => {
    if (!selectedObject) return;

    if (selectedObject.type === 'vessel') {
      const vessel = vesselsData?.vessels?.find((v) => v.vessel_id === selectedObject.id);
      if (vessel) {
        handleSetDrawerContent(
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">ID: {vessel.vessel_id}</p>
            <p className="text-muted-foreground">Name: {vessel.vessel_name}</p>
            <p className="text-muted-foreground">
              Match: {((vessel.score ?? 0) * 100).toFixed(1)}%
            </p>
            <p className="text-muted-foreground">
              Provenance: {vessel.is_mock ? 'DEMO / MOCK' : 'LIVE AIS'}
            </p>
          </div>,
          'Vessel Details'
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
          'Source Estimate Details'
        );
      }
    } else if (selectedObject.type === 'oil') {
      const raw = spillDetails?.confidence_score ?? 0;
      const conf = raw <= 1 ? raw * 100 : raw;
      handleSetDrawerContent(
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">Status: Detected</p>
          <p className="text-muted-foreground">
            Area: {spillDetails?.area_km2?.toFixed(2)} km²
          </p>
          <p className="text-muted-foreground">Detection Confidence: {conf.toFixed(1)}%</p>
        </div>,
        'Incident Details'
      );
    }
  }, [selectedObject, vesselsData, backtrackData, spillDetails]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setDrawerContent(null);
      setSelectedObject(null);
    }, 300);
  };

  const showIntel = !isFullscreen && intelOpen;

  if (isFullscreen) {
    return (
      <InteractionContext.Provider
        value={{
          selectedObject,
          setSelectedObject,
          isFullscreen,
          setFullscreen,
          drawerContent,
          setDrawerContent: handleSetDrawerContent,
        }}
      >
        <div className="fixed inset-0 z-50 bg-[#010810]">
          <SimulationViewport />
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-30 flex items-center gap-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-md backdrop-blur border border-white/10"
          >
            <Minimize2 size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Exit</span>
          </button>
          <SlideInDrawer isOpen={drawerOpen} onClose={closeDrawer} title={drawerTitle}>
            {drawerContent}
          </SlideInDrawer>
        </div>
      </InteractionContext.Provider>
    );
  }

  return (
    <InteractionContext.Provider
      value={{
        selectedObject,
        setSelectedObject,
        isFullscreen,
        setFullscreen,
        drawerContent,
        setDrawerContent: handleSetDrawerContent,
      }}
    >
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans relative">
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0 h-full relative overflow-y-auto custom-scrollbar">
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md">
            <Header />
            <EvidenceChain />
          </div>

          {/* Scrollable workspace — 3D gets generous min height */}
          <div className="flex flex-col min-h-0">
            <section className="relative flex min-h-[72vh] h-[72vh] lg:min-h-[78vh] lg:h-[78vh] bg-[#010810] shrink-0">
              <div className="relative min-w-0 flex-1 h-full">
                <SimulationViewport />

                <button
                  type="button"
                  onClick={() => setIntelOpen((v) => !v)}
                  className="absolute top-3 right-3 z-30 hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/70 hover:bg-slate-900/90 text-slate-200 rounded-md backdrop-blur border border-white/10 transition-colors text-[10px] font-semibold tracking-wider uppercase"
                  title={intelOpen ? 'Hide intelligence panel' : 'Show intelligence panel'}
                >
                  {intelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                  {intelOpen ? 'Hide intel' : 'Intel'}
                </button>

                <button
                  type="button"
                  onClick={() => setFullscreen(true)}
                  className={`absolute z-30 p-2 bg-black/40 hover:bg-black/60 text-white rounded-md backdrop-blur border border-white/10 transition-colors top-3 ${
                    intelOpen ? 'right-3 lg:right-[9.5rem]' : 'right-3 lg:right-[5.75rem]'
                  }`}
                  title="Fullscreen"
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {showIntel && (
                <aside className="hidden lg:flex w-[300px] xl:w-[320px] shrink-0 border-l border-border bg-card/90 backdrop-blur-md flex-col h-full overflow-hidden">
                  <div className="px-3 py-2 border-b border-border shrink-0">
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Intelligence
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    <IntelligencePanel />
                  </div>
                </aside>
              )}
            </section>

            <IncidentAnalysisDock />
          </div>
        </div>

        <SlideInDrawer isOpen={drawerOpen} onClose={closeDrawer} title={drawerTitle}>
          {drawerContent}
        </SlideInDrawer>
      </div>
    </InteractionContext.Provider>
  );
};

export const IncidentReconstructionPage: React.FC = () => {
  return (
    <IncidentProvider>
      <SimulationProvider>
        <SceneLayersProvider>
          <OceanControlsProvider>
            <ViewportCameraProvider>
              <ReconstructionWorkspace />
            </ViewportCameraProvider>
          </OceanControlsProvider>
        </SceneLayersProvider>
      </SimulationProvider>
    </IncidentProvider>
  );
};
