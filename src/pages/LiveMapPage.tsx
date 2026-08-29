import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import Map, { MapRef, ScaleControl, NavigationControl } from 'react-map-gl/maplibre';
import { DeckGLOverlay } from '../components/map/DeckGLOverlay';
import { useMapLayers } from '../hooks/useMapLayers';
import { JobProgress } from '../components/map/JobProgress';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  MOCK_SPILLS,
  MOCK_ATTRIBUTION,
  MOCK_ENVIRONMENT,
  MOCK_HINDCAST,
  MOCK_TRAJECTORIES
} from '../data/mockMapData';

import type {
  SpillEvent,
  AttributionResult,
  EnvironmentData,
  HindcastResult,
  VesselTrajectory,
  JobStatus
} from '../types/map';

import { LayerVisibility, TooltipData, MapViewState } from '../types/ui';
import { MAP_STYLES, INITIAL_VIEW_STATE, FLY_TO_CONFIG } from '../config/mapConfig';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from '../components/map/controls/ThemeToggle';
import { MapControls } from '../components/map/controls/MapControls';
import { SearchBar } from '../components/map/controls/SearchBar';
import { SlideInPanel } from '../components/map/overlays/SlideInPanel';
import { MapTooltip } from '../components/map/overlays/MapTooltip';
import { MapSkeleton } from '../components/map/overlays/MapSkeleton';
import { usePulseMarkers } from '../components/map/layers/PulseMarker';
import { useVesselAnimation } from '../hooks/useVesselAnimation';

const BASE_CENTROID = { latitude: 33.5, longitude: 34.0 }; // Spill 1 centroid Reference

export function LiveMapPage() {
  const mapRef = useRef<MapRef>(null);
  const { theme } = useTheme();

  // States
  const [spills, setSpills] = useState<SpillEvent[]>(MOCK_SPILLS);
  const [selectedSpillId, setSelectedSpillId] = useState<string | null>(null);
  const [showAttribution, setShowAttribution] = useState(false);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Controlled viewport state
  const [viewState, setViewState] = useState<MapViewState>({
    longitude: INITIAL_VIEW_STATE.longitude,
    latitude: INITIAL_VIEW_STATE.latitude,
    zoom: INITIAL_VIEW_STATE.zoom,
    pitch: INITIAL_VIEW_STATE.pitch,
    bearing: INITIAL_VIEW_STATE.bearing
  });

  // Layers visibility state
  const [layersVisibility, setLayersVisibility] = useState<LayerVisibility>({
    spills: true,
    hindcast: false,
    vessels: true,
    wind: false
  });

  // Hover Tooltip state
  const [hoverInfo, setHoverInfo] = useState<TooltipData | null>(null);

  // Map Cursor state
  const [mapCursor, setMapCursor] = useState<string>('crosshair');

  // Expanded Cluster state for spiderify clustering
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  // Selected Spill object
  const selectedSpill = useMemo(() => {
    return spills.find(s => s.spill_id === selectedSpillId) || null;
  }, [spills, selectedSpillId]);

  // Derive geographical offsets to align Spill 1's mock details to other centroids
  const activeData = useMemo(() => {
    if (!selectedSpill) {
      return { attribution: null, environment: null, hindcast: null, trajectories: {} };
    }

    const dLat = selectedSpill.centroid.latitude - BASE_CENTROID.latitude;
    const dLon = selectedSpill.centroid.longitude - BASE_CENTROID.longitude;

    // 1. Environment data offset
    const environment: EnvironmentData = {
      ...MOCK_ENVIRONMENT,
      location: {
        latitude: selectedSpill.centroid.latitude,
        longitude: selectedSpill.centroid.longitude
      }
    };

    // 2. Hindcast result coordinates offset
    const hindcast: HindcastResult = {
      ...MOCK_HINDCAST,
      spill_id: selectedSpill.spill_id,
      source_region: {
        ...MOCK_HINDCAST.source_region,
        coordinates: MOCK_HINDCAST.source_region.coordinates.map(ring =>
          ring.map(pt => [pt[0] + dLon, pt[1] + dLat])
        )
      },
      particles: MOCK_HINDCAST.particles.map(p => ({
        ...p,
        latitude: p.latitude + dLat,
        longitude: p.longitude + dLon
      }))
    };

    // 3. Attribution details
    const attribution: AttributionResult = {
      ...MOCK_ATTRIBUTION,
      spill_id: selectedSpill.spill_id
    };

    // 4. AIS vessel track coordinates offset
    const trajectories: Record<string, VesselTrajectory> = {};
    Object.entries(MOCK_TRAJECTORIES).forEach(([id, traj]) => {
      trajectories[id] = {
        ...traj,
        points: traj.points.map(p => ({
          ...p,
          latitude: p.latitude + dLat,
          longitude: p.longitude + dLon
        }))
      };
    });

    return { attribution, environment, hindcast, trajectories };
  }, [selectedSpill]);

  // Selected Vessel Route Points for animation
  const suspectVesselTrajectory = useMemo(() => {
    if (!activeData.attribution || !activeData.trajectories) return null;
    const primaryVessel = activeData.attribution.ranked_vessels.find(v => v.rank === 1);
    if (!primaryVessel) return null;
    return activeData.trajectories[primaryVessel.vessel_id]?.points || null;
  }, [activeData.attribution, activeData.trajectories]);

  // Play animation whenever we have an attributed spill selected and detail panel is open
  const isAnimating = !!(selectedSpill?.status === 'attributed' && showAttribution);

  const { position: animatedVesselPosition } = useVesselAnimation(
    suspectVesselTrajectory,
    isAnimating
  );

  // Click / Selection handler for Spill
  const handleSelectSpill = useCallback((spill: SpillEvent) => {
    setSelectedSpillId(spill.spill_id);
    setExpandedClusterId(null);
    
    // Pan / Zoom map smoothly to spill centroid
    setViewState(prev => ({
      ...prev,
      longitude: spill.centroid.longitude,
      latitude: spill.centroid.latitude,
      zoom: 8,
      transitionDuration: FLY_TO_CONFIG.duration
    }));

    // Trigger simulation timeline or attribution slider
    if (spill.status === 'processing') {
      setJob({
        job_id: `JOB-${spill.spill_id}`,
        status: 'running',
        stage: 'Simulating surface drift particle tracks (hindcast)',
        progress: 45,
        message: 'Integrating CMEMS ocean current fields & ERA5 wind forcing...',
        updated_at: new Date().toISOString()
      });
      setShowAttribution(false);
    } else if (spill.status === 'detected') {
      setJob({
        job_id: `JOB-${spill.spill_id}`,
        status: 'queued',
        stage: 'Waiting in queue...',
        progress: 0,
        message: 'Job queued. Waiting for system resources...',
        updated_at: new Date().toISOString()
      });
      setShowAttribution(false);
    } else {
      setJob(null);
      setShowAttribution(true);
    }
  }, []);

  // Reset view back to Mediterranean center
  const resetMap = useCallback(() => {
    setSelectedSpillId(null);
    setShowAttribution(false);
    setJob(null);
    setExpandedClusterId(null);
    setViewState(prev => ({
      ...prev,
      longitude: INITIAL_VIEW_STATE.longitude,
      latitude: INITIAL_VIEW_STATE.latitude,
      zoom: INITIAL_VIEW_STATE.zoom,
      transitionDuration: 1500
    }));
  }, []);

  // Deck.gl onHover tooltip handler
  const handleHover = useCallback((info: any) => {
    if (info && info.object) {
      const { x, y, layer, object } = info;
      let type: 'spill' | 'vessel' | 'source-region' = 'spill';
      let tooltipData: any = {};

      if (layer.id === 'spill-layer') {
        type = 'spill';
        tooltipData = {
          id: object.spill_id,
          confidence: object.detection_confidence,
          status: object.status
        };
      } else if (layer.id === 'vessel-marker-layer' || layer.id === 'vessel-track-layer') {
        type = 'vessel';
        tooltipData = {
          id: object.vessel_id,
          vesselType: object.vessel_type,
          speed: object.points[object.points.length - 1].speed
        };
      } else if (layer.id === 'source-region-layer') {
        type = 'source-region';
        tooltipData = {};
      } else {
        setMapCursor('crosshair');
        setHoverInfo(null);
        return;
      }

      setMapCursor('pointer');
      setHoverInfo({
        x,
        y,
        type,
        data: tooltipData
      });
    } else {
      setMapCursor('crosshair');
      setHoverInfo(null);
    }
  }, []);

  // Pulse markers MapLibre lifecycle hook
  usePulseMarkers(mapInstance, spills, handleSelectSpill, layersVisibility.spills);

  // Simulation pipeline mock loop
  useEffect(() => {
    if (!job) return;

    const interval = setInterval(() => {
      setJob(prevJob => {
        if (!prevJob) return null;

        if (prevJob.status === 'queued') {
          return {
            ...prevJob,
            status: 'running',
            stage: 'Running hindcast simulation...',
            progress: 15,
            message: 'Computing CMEMS/ERA5 force vectors...',
            updated_at: new Date().toISOString()
          };
        }

        if (prevJob.status === 'running') {
          const nextProgress = prevJob.progress + Math.floor(Math.random() * 12) + 6;
          if (nextProgress >= 100) {
            clearInterval(interval);

            // Simulation completes: Update spill status to 'attributed'
            const targetSpillId = prevJob.job_id.replace('JOB-', '');
            setSpills(prevSpills =>
              prevSpills.map(s =>
                s.spill_id === targetSpillId ? { ...s, status: 'attributed' } : s
              )
            );

            // Trigger slide-in panel display
            setTimeout(() => {
              setShowAttribution(true);
            }, 600);

            return {
              ...prevJob,
              status: 'completed',
              progress: 100,
              stage: 'Attribution completed',
              message: 'Pipeline finished successfully.',
              updated_at: new Date().toISOString()
            };
          }

          let stage = prevJob.stage;
          let message = prevJob.message;
          if (nextProgress >= 40 && nextProgress < 75) {
            stage = 'Retrieving AIS vessel tracks...';
            message = 'Filtering candidate vessels within source region...';
          } else if (nextProgress >= 75) {
            stage = 'Executing attribution scoring...';
            message = 'Computing distance, loitering, and heading vectors...';
          }

          return {
            ...prevJob,
            progress: nextProgress,
            stage,
            message,
            updated_at: new Date().toISOString()
          };
        }

        return prevJob;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [job]);

  // Build deck.gl layers
  const layers = useMapLayers({
    spills,
    selectedSpill,
    attribution: activeData.attribution,
    environment: activeData.environment,
    hindcast: activeData.hindcast,
    trajectories: activeData.trajectories,
    onSpillClick: handleSelectSpill,
    layers: layersVisibility,
    animatedVesselPosition,
    zoom: viewState.zoom,
    expandedClusterId,
    onClusterClick: setExpandedClusterId,
    theme
  });

  return (
    <div className={`flex h-screen w-full transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0F1117] text-[#94A3B8]' : 'bg-white text-[#4B5563]'
    } overflow-hidden font-sans`}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />

        {/* Map Viewport Area */}
        <div className={`flex-1 w-full h-full relative ${
          theme === 'dark' ? 'bg-[#0B0D12]' : 'bg-slate-100'
        }`}>
          {!isLoaded && <MapSkeleton />}

          <Map
            ref={mapRef}
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            mapStyle={MAP_STYLES[theme]}
            onLoad={(evt: any) => {
              setIsLoaded(true);
              setMapInstance(evt.target);
            }}
            reuseMaps
            cursor={mapCursor}
            onDragStart={() => setMapCursor('grabbing')}
            onDragEnd={() => setMapCursor('crosshair')}
          >
            {/* deck.gl overlay */}
            <DeckGLOverlay
              layers={layers}
              onHover={handleHover}
              // @ts-ignore
              interleaved={true}
            />
            <NavigationControl showCompass={true} showZoom={false} position="bottom-right" />
            <ScaleControl unit="metric" position="bottom-left" />
          </Map>

          {/* Hover Tooltip */}
          <MapTooltip hoverInfo={hoverInfo} theme={theme} />

          {/* Floating Controls (Top Left) */}
          <div className="absolute top-20 left-4 z-10 flex flex-col gap-2">
            {/* Map Mode Title Indicator */}
            <div className={`flex items-center gap-2.5 px-3 py-2 border backdrop-blur-md rounded-xl text-xs font-semibold shadow-xl ${
              theme === 'dark' ? 'bg-[#1A1D27]/90 border-[#252830] text-[#F1F5F9]' : 'bg-white/90 border-[#E5E7EB] text-[#1A1D23]'
            }`}>
              <Layers size={14} className={theme === 'dark' ? 'text-[#00D9A6]' : 'text-[#00B894]'} />
              <span>Mediterranean Interactive Spill Map</span>
            </div>

            {/* Spill Stats Summary when none selected */}
            {!selectedSpill && (
              <div className={`p-4 border backdrop-blur-md rounded-xl space-y-2 shadow-xl w-60 ${
                theme === 'dark' ? 'bg-[#1A1D27]/90 border-[#252830]' : 'bg-white/90 border-[#E5E7EB]'
              }`}>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
                  Active Spills
                </span>
                <div className="space-y-1.5">
                  {spills.map(s => (
                    <button
                      key={s.spill_id}
                      onClick={() => handleSelectSpill(s)}
                      className={`w-full text-left flex items-center justify-between text-xs p-1.5 rounded transition-colors ${
                        theme === 'dark' ? 'hover:bg-[#252830]/50' : 'hover:bg-slate-100'
                      }`}
                    >
                      <span className={`font-mono font-medium ${theme === 'dark' ? 'text-[#F1F5F9]' : 'text-slate-700'}`}>{s.spill_id}</span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          s.status === 'attributed'
                            ? 'bg-emerald-500/10 text-[#00D9A6]'
                            : s.status === 'processing'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {s.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Spill click prompt when none selected */}
            {!selectedSpill && (
              <div className={`flex items-center gap-2 px-3 py-2 border text-rose-500 rounded-xl text-xs font-medium shadow-xl w-60 ${
                theme === 'dark' ? 'bg-[#1A1D27]/95 border-[#252830]' : 'bg-white/95 border-[#E5E7EB]'
              }`}>
                <AlertCircle size={14} className="shrink-0" />
                <span>Select a spill polygon on the map or panel to inspect.</span>
              </div>
            )}

            {/* Back to Mediterranean view controls */}
            {selectedSpill && (
              <button
                onClick={resetMap}
                className={`flex items-center gap-2 px-3.5 py-2.5 border rounded-xl text-xs font-semibold shadow-xl transition-all w-fit active:scale-95 ${
                  theme === 'dark' ? 'bg-[#1A1D27] hover:bg-[#252830] border-[#252830] text-[#F1F5F9]' : 'bg-white hover:bg-slate-50 border-[#E5E7EB] text-slate-700'
                }`}
              >
                <RefreshCw size={13} className={theme === 'dark' ? 'text-[#00D9A6]' : 'text-[#00B894]'} />
                <span>Reset View</span>
              </button>
            )}
          </div>

          {/* Theme toggle & Controls */}
          <div className="absolute top-4 right-16 z-10"><ThemeToggle /></div>
          <SearchBar spills={spills} onSelectSpill={handleSelectSpill} theme={theme} />
          
          <MapControls
            onZoomIn={() => setViewState(v => ({ ...v, zoom: Math.min(v.zoom + 1, 20), transitionDuration: 300 }))}
            onZoomOut={() => setViewState(v => ({ ...v, zoom: Math.max(v.zoom - 1, 1), transitionDuration: 300 }))}
            layers={layersVisibility}
            onToggleLayer={(key) => setLayersVisibility(l => ({ ...l, [key]: !l[key] }))}
            theme={theme}
          />

          {/* Animated Detail Panel */}
          <SlideInPanel
            spill={showAttribution ? selectedSpill : null}
            attribution={activeData.attribution}
            onClose={() => setShowAttribution(false)}
            theme={theme}
          />

          {/* Bottom Processing Job Progress Bar */}
          <JobProgress job={job} />
        </div>
      </main>
    </div>
  );
}
export default LiveMapPage;
