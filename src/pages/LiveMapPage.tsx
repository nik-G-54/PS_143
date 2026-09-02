import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const BASE_CENTROID = { latitude: 33.5, longitude: 34.0 }; // Spill 1 centroid Reference

export function LiveMapPage() {
  const mapRef = useRef<MapRef>(null);
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();

  // States
  const [spills, setSpills] = useState<SpillEvent[]>(MOCK_SPILLS);
  const [selectedSpillId, setSelectedSpillId] = useState<string | null>(null);
  const [showAttribution, setShowAttribution] = useState(false);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Async API Integration States (with Fallbacks)
  const [attribution, setAttribution] = useState<AttributionResult | null>(null);
  const [environment, setEnvironment] = useState<EnvironmentData | null>(null);
  const [hindcast, setHindcast] = useState<HindcastResult | null>(null);
  const [trajectories, setTrajectories] = useState<Record<string, VesselTrajectory>>({});

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

  // Load spills from API or fall back to mock
  useEffect(() => {
    const fetchSpills = async () => {
      try {
        const res = await fetch('/api/v1/spills');
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSpills(data);
            console.log('📡 Spills successfully loaded from backend API');
            return;
          }
        }
      } catch (e) {
        console.error('Error fetching spills, using mock:', e);
      }
      setSpills(MOCK_SPILLS);
      console.log('💾 Spills loaded from frontend mock fallback');
    };
    fetchSpills();
  }, []);

  // Async Load Spill Data with Fallback to Mock Data
  const loadSpillData = useCallback(async (spill: SpillEvent) => {
    const dLat = spill.centroid.latitude - BASE_CENTROID.latitude;
    const dLon = spill.centroid.longitude - BASE_CENTROID.longitude;

    // 1. Generate fallback datasets using offsets from mock data
    const fallbackEnvironment: EnvironmentData = {
      ...MOCK_ENVIRONMENT,
      location: {
        latitude: spill.centroid.latitude,
        longitude: spill.centroid.longitude
      }
    };

    const fallbackHindcast: HindcastResult = {
      ...MOCK_HINDCAST,
      spill_id: spill.spill_id,
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

    const fallbackAttribution: AttributionResult = {
      ...MOCK_ATTRIBUTION,
      spill_id: spill.spill_id
    };

    const fallbackTrajectories: Record<string, VesselTrajectory> = {};
    Object.entries(MOCK_TRAJECTORIES).forEach(([id, traj]) => {
      fallbackTrajectories[id] = {
        ...traj,
        points: traj.points.map(p => ({
          ...p,
          latitude: p.latitude + dLat,
          longitude: p.longitude + dLon
        }))
      };
    });

    // 2. Fetch Environment data
    try {
      const res = await fetch(`/api/v1/spills/${spill.spill_id}/environment`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setEnvironment(data);
        console.log(`📡 Environment data for ${spill.spill_id} loaded from backend`);
      } else {
        setEnvironment(fallbackEnvironment);
        console.log(`💾 Environment data for ${spill.spill_id} using frontend mock fallback`);
      }
    } catch (e) {
      setEnvironment(fallbackEnvironment);
      console.log(`💾 Environment data for ${spill.spill_id} using frontend mock fallback (error)`);
    }

    // 3. Fetch Hindcast data
    try {
      const res = await fetch(`/api/v1/hindcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spill_id: spill.spill_id,
          input: {
            latitude: spill.centroid.latitude,
            longitude: spill.centroid.longitude,
            timestamp: spill.timestamp,
            backward_hours: 72,
            windage_factor: 0.03
          }
        })
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setHindcast(data);
        console.log(`📡 Hindcast data for ${spill.spill_id} loaded from backend`);
      } else {
        setHindcast(fallbackHindcast);
        console.log(`💾 Hindcast data for ${spill.spill_id} using frontend mock fallback`);
      }
    } catch (e) {
      setHindcast(fallbackHindcast);
      console.log(`💾 Hindcast data for ${spill.spill_id} using frontend mock fallback (error)`);
    }

    // 4. Fetch Attribution data
    let activeAttribution = fallbackAttribution;
    try {
      const res = await fetch(`/api/v1/attribution/${spill.spill_id}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setAttribution(data);
        activeAttribution = data;
        console.log(`📡 Attribution ranking for ${spill.spill_id} loaded from backend`);
      } else {
        setAttribution(fallbackAttribution);
        console.log(`💾 Attribution ranking for ${spill.spill_id} using frontend mock fallback`);
      }
    } catch (e) {
      setAttribution(fallbackAttribution);
      console.log(`💾 Attribution ranking for ${spill.spill_id} using frontend mock fallback (error)`);
    }

    // 5. Fetch Trajectories for candidate vessels
    try {
      const vesselsToFetch = activeAttribution?.ranked_vessels || [];
      if (vesselsToFetch.length > 0) {
        const fetchedTrajs: Record<string, VesselTrajectory> = {};
        const spillTime = new Date(spill.timestamp).getTime();
        const startStr = new Date(spillTime - 12 * 60 * 60 * 1000).toISOString();
        const endStr = new Date(spillTime + 12 * 60 * 60 * 1000).toISOString();

        for (const vessel of vesselsToFetch) {
          try {
            const res = await fetch(`/api/v1/vessels/${vessel.vessel_id}/trajectory?start=${startStr}&end=${endStr}`);
            const contentType = res.headers.get('content-type');
            if (res.ok && contentType && contentType.includes('application/json')) {
              fetchedTrajs[vessel.vessel_id] = await res.json();
              console.log(`📡 Trajectory for vessel ${vessel.vessel_id} loaded from backend`);
            } else {
              fetchedTrajs[vessel.vessel_id] = fallbackTrajectories[vessel.vessel_id] || {
                vessel_id: vessel.vessel_id,
                vessel_type: vessel.vessel_type,
                points: []
              };
              console.log(`💾 Trajectory for vessel ${vessel.vessel_id} using frontend mock fallback`);
            }
          } catch (e) {
            fetchedTrajs[vessel.vessel_id] = fallbackTrajectories[vessel.vessel_id] || {
              vessel_id: vessel.vessel_id,
              vessel_type: vessel.vessel_type,
              points: []
            };
            console.log(`💾 Trajectory for vessel ${vessel.vessel_id} using frontend mock fallback (error)`);
          }
        }
        setTrajectories(fetchedTrajs);
      } else {
        setTrajectories(fallbackTrajectories);
      }
    } catch (e) {
      setTrajectories(fallbackTrajectories);
    }
  }, []);

  // Trigger load when selected spill changes
  useEffect(() => {
    if (!selectedSpill) {
      setAttribution(null);
      setEnvironment(null);
      setHindcast(null);
      setTrajectories({});
      return;
    }
    loadSpillData(selectedSpill);
  }, [selectedSpill, loadSpillData]);

  // Expose active data (uses state values or fallbacks dynamically)
  const activeData = useMemo(() => {
    return { attribution, environment, hindcast, trajectories };
  }, [attribution, environment, hindcast, trajectories]);

  // Find final destination of the suspect vessel trajectory (static position, no animation loop)
  const suspectVesselFinalPosition = useMemo(() => {
    if (!activeData.attribution || !activeData.trajectories) return null;
    const primaryVessel = activeData.attribution.ranked_vessels.find(v => v.rank === 1);
    if (!primaryVessel) return null;
    const trajPoints = activeData.trajectories[primaryVessel.vessel_id]?.points || [];
    if (trajPoints.length === 0) return null;
    const lastPoint = trajPoints[trajPoints.length - 1];
    return {
      lat: lastPoint.latitude,
      lng: lastPoint.longitude,
      course: lastPoint.course
    };
  }, [activeData.attribution, activeData.trajectories]);

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

  // Handle URL query parameters (e.g. ?spill_id=... or ?vessel=...)
  useEffect(() => {
    if (spills.length > 0) {
      const initialSpillId = searchParams.get('spill_id');
      const initialVesselId = searchParams.get('vessel');
      
      let targetSpillId = initialSpillId;
      if (!targetSpillId && initialVesselId) {
        if (initialVesselId === 'SYNTH-000011') targetSpillId = 'DARTIS-2019-001';
        else if (initialVesselId === 'SYNTH-000007') targetSpillId = 'DARTIS-2019-002';
        else if (initialVesselId === 'SYNTH-000023') targetSpillId = 'DARTIS-2019-004';
      }
      
      if (targetSpillId) {
        const foundSpill = spills.find(s => s.spill_id === targetSpillId);
        if (foundSpill) {
          const timer = setTimeout(() => {
            handleSelectSpill(foundSpill);
          }, 300);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [spills, searchParams, handleSelectSpill]);

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

  // Simulation pipeline mock loop with API Polling & Fallback
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/jobs/${job.job_id}`);
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setJob(data);
          
          if (data.status === 'completed') {
            clearInterval(interval);
            const targetSpillId = job.job_id.replace('JOB-', '');
            setSpills(prevSpills =>
              prevSpills.map(s =>
                s.spill_id === targetSpillId ? { ...s, status: 'attributed' } : s
              )
            );
            setTimeout(() => {
              setShowAttribution(true);
            }, 600);
          }
          return;
        }
      } catch (e) {
        console.warn('Job status API failed, running fallback simulation:', e);
      }

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

            const targetSpillId = prevJob.job_id.replace('JOB-', '');
            setSpills(prevSpills =>
              prevSpills.map(s =>
                s.spill_id === targetSpillId ? { ...s, status: 'attributed' } : s
              )
            );

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
    animatedVesselPosition: suspectVesselFinalPosition,
    zoom: viewState.zoom,
    expandedClusterId,
    onClusterClick: setExpandedClusterId,
    theme
  });

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />

        {/* Map Viewport Area */}
        <div className="flex-1 w-full h-full relative bg-background">
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
            <div className="flex items-center gap-2.5 px-3 py-2 border border-border bg-card/90 backdrop-blur-md rounded-xl text-xs font-semibold shadow-md text-foreground">
              <Layers size={14} className="text-primary" />
              <span>Mediterranean Interactive Spill Map</span>
            </div>

            {/* Spill Stats Summary when none selected */}
            {!selectedSpill && (
              <div className="p-4 border border-border bg-card/90 backdrop-blur-md rounded-xl space-y-2 shadow-md w-60">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Active Spills
                </span>
                <div className="space-y-1.5">
                  {spills.map(s => (
                    <button
                      key={s.spill_id}
                      onClick={() => handleSelectSpill(s)}
                      className="w-full text-left flex items-center justify-between text-xs p-1.5 rounded transition-colors hover:bg-accent"
                    >
                      <span className="font-mono font-medium text-foreground">{s.spill_id}</span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          s.status === 'attributed'
                            ? 'bg-chart-1/15 text-chart-1'
                            : s.status === 'processing'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-destructive/15 text-destructive'
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
              <div className="flex items-center gap-2 px-3 py-2 border border-border bg-card/95 backdrop-blur-md text-destructive rounded-xl text-xs font-medium shadow-md w-60">
                <AlertCircle size={14} className="shrink-0" />
                <span>Select a spill polygon on the map or panel to inspect.</span>
              </div>
            )}

            {/* Back to Mediterranean view controls */}
            {selectedSpill && (
              <button
                onClick={resetMap}
                className="flex items-center gap-2 px-3.5 py-2.5 border border-border bg-card hover:bg-accent rounded-xl text-xs font-semibold shadow-md transition-all w-fit active:scale-95 text-foreground"
              >
                <RefreshCw size={13} className="text-primary" />
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
