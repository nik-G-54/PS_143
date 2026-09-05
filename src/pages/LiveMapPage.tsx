// src/pages/LiveMapPage.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Map, { NavigationControl, MapRef } from 'react-map-gl/maplibre';
import { TextLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import MinimapControl from 'maplibregl-minimap';

import { useSpills } from '../hooks/useSpills';
import { useSpillDetail } from '../hooks/useSpillDetail';
import { useEnvironmentLayers } from '../hooks/useEnvironmentLayers';
import { useVesselTracks } from '../hooks/useVesselTracks';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

import { exportMapPNG, exportSpillGeoJSON } from '../lib/exportUtils';
import { ResponsiveLayout } from '../components/map/ResponsiveLayout';
import { PlaybackTimeline } from '../components/map/PlaybackTimeline';
import { StatsHUD } from '../components/map/StatsHUD';
import { LayerToggle } from '../components/map/LayerToggle';
import { SlideInPanel } from '../components/map/overlays/SlideInPanel';
import { EnvironmentHUD } from '../components/map/overlays/EnvironmentHUD';
import { DeckGLOverlay } from '../components/map/DeckGLOverlay';
import { VesselControls } from '../components/map/controls/VesselControls';
import { ShortcutsHelp } from '../components/map/overlays/ShortcutsHelp';

import { addSpillPolygon, removeSpillPolygon } from '../components/map/layers/SpillPolygonLayers';
import { addSourceRadius, removeSourceRadius } from '../components/map/layers/SourceRadiusCircle';
import { addPulsingOrigin, removePulsingOrigin } from '../components/map/layers/PulsingOrigin';
import { addDriftTrajectory, removeDriftTrajectory } from '../components/map/layers/DriftTrajectory';
import { addVesselMarkers, removeVesselMarkers } from '../components/map/layers/VesselMarkers';

import { WindOverlay } from '../components/map/WindOverlay';
import { useWindArrowsLayers } from '../components/map/WindArrows';
import { useVesselTrackLayers } from '../components/map/VesselTrackLayer';
import { createSpillPinLayer } from '../layers/spillPinLayer';

import type { SpillEvent } from '../types/spill';
import 'maplibre-gl/dist/maplibre-gl.css';

export type ViewMode = 'heatmap' | 'clusters' | 'markers';

const INITIAL_VIEW = {
  latitude: 35.05,
  longitude: 24.05,
  zoom: 11,
  pitch: 45,
  bearing: 0
};

const DARK_STYLE = import.meta.env.VITE_MAP_STYLE_DARK || 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_STYLE = import.meta.env.VITE_MAP_STYLE_LIGHT || 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export function LiveMapPage() {
  const mapRef = useRef<MapRef | null>(null);
  const { rawSpills: spills, loading: listLoading, error: listError } = useSpills();

  const [viewMode, setViewMode] = useState<ViewMode>('clusters');
  const [selectedSpill, setSelectedSpill] = useState<SpillEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [viewState, setViewState] = useState(INITIAL_VIEW);

  // Vessel playback state
  const [vesselVisible] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [playbackTime, setPlaybackTime] = useState<number>(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<number>(0);

  // Sorted spills for keyboard navigation (memoized to avoid O(n log n) churn on every render)
  const sortedSpills = useMemo(() => {
    return [...spills].sort(
      (a, b) => new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime()
    );
  }, [spills]);

  // Fetch P2 spill detail when selectedSpill is set
  const { spill: spillDetail, vessels, visualization, loading: detailLoading } = useSpillDetail(
    selectedSpill ? selectedSpill.spill_id : null
  );

  // Fetch vessel tracks for P4 playback
  const { tracks } = useVesselTracks(
    selectedSpill?.spill_id || null,
    selectedSpill,
    visualization
  );

  // Reset playback timestamp when selectedSpill changes
  useEffect(() => {
    if (selectedSpill) {
      const spillTs = new Date(selectedSpill.detected_at).getTime();
      setPlaybackTime(spillTs);
      setIsPlaying(false);
    }
  }, [selectedSpill]);

  // Vessel playback timer animation loop
  useEffect(() => {
    if (!isPlaying || !selectedSpill) return;

    const spillTime = new Date(selectedSpill.detected_at).getTime();
    const startTime = spillTime - 6 * 3600 * 1000; // 6 hours before
    const endTime = spillTime + 2 * 3600 * 1000;   // 2 hours after

    let current = playbackTime >= endTime || playbackTime < startTime ? startTime : playbackTime;
    const speed = 100; // 100x real-time speed

    function tick() {
      current += speed * 100; // ~100ms step per frame
      if (current >= endTime) {
        current = startTime; // Loop
      }
      setPlaybackTime(current);
      playbackRef.current = requestAnimationFrame(tick);
    }

    playbackRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(playbackRef.current);
  }, [isPlaying, selectedSpill]);

  // Deck.gl environment layers (Wind + Current arrows)
  const envLayers = useEnvironmentLayers(visualization);

  // Deck.gl wind vector arrow layers
  const windArrowsLayers = useWindArrowsLayers(
    visualization?.environment?.wind || null,
    visualization?.environment?.current || null,
    visualization?.spill ? { lon: visualization.spill.longitude, lat: visualization.spill.latitude } : null
  );

  // Deck.gl vessel track layers (TripsLayer + markers + badges)
  const vesselTrackLayers = useVesselTrackLayers(
    tracks,
    playbackTime,
    vesselVisible && Boolean(selectedSpill),
    showTrails
  );

  // Filter spills by selected date
  const filteredSpills = useMemo(() => {
    if (!selectedDate) return spills;
    return spills.filter(s => s.detected_at.startsWith(selectedDate));
  }, [spills, selectedDate]);

  // Spills to display on map — isolates selected spill when active to hide background clutter
  const activeSpills = useMemo(() => {
    if (selectedSpill) {
      return [selectedSpill];
    }
    return filteredSpills;
  }, [filteredSpills, selectedSpill]);

  // Fly to spill when selected
  const handleSelectSpill = useCallback((spill: SpillEvent) => {
    setSelectedSpill(spill);
    setViewState(prev => ({
      ...prev,
      longitude: spill.centroid.lon,
      latitude: spill.centroid.lat,
      zoom: 12,
      transitionDuration: 1200
    }));
  }, []);

  // View modes cycle
  const viewModes = ['heatmap', 'clusters', 'markers'] as const;
  const cycleViewMode = useCallback(() => {
    setViewMode(prev => {
      const idx = viewModes.indexOf(prev);
      return viewModes[(idx + 1) % viewModes.length];
    });
  }, []);

  // P6 Keyboard Shortcuts Setup
  useKeyboardShortcuts({
    onToggleView: cycleViewMode,
    onNextSpill: () => {
      if (!sortedSpills.length) return;
      const currentIdx = selectedSpill
        ? sortedSpills.findIndex(s => s.spill_id === selectedSpill.spill_id)
        : -1;
      const nextIdx = Math.min(sortedSpills.length - 1, currentIdx + 1);
      handleSelectSpill(sortedSpills[nextIdx]);
    },
    onPrevSpill: () => {
      if (!sortedSpills.length) return;
      const currentIdx = selectedSpill
        ? sortedSpills.findIndex(s => s.spill_id === selectedSpill.spill_id)
        : 1;
      const prevIdx = Math.max(0, currentIdx - 1);
      handleSelectSpill(sortedSpills[prevIdx]);
    },
    onTogglePlayback: () => setIsPlaying(prev => !prev),
    onZoomIn: () => {
      setViewState(prev => ({ ...prev, zoom: Math.min(18, prev.zoom + 1), transitionDuration: 300 }));
    },
    onZoomOut: () => {
      setViewState(prev => ({ ...prev, zoom: Math.max(3, prev.zoom - 1), transitionDuration: 300 }));
    },
    onResetView: () => {
      setViewState({ ...INITIAL_VIEW, transitionDuration: 1200 });
    },
    onExportPNG: () => exportMapPNG(mapRef.current),
    onExportGeoJSON: () => exportSpillGeoJSON(spills, selectedSpill, visualization),
    onToggleHUD: () => setShowHUD(prev => !prev),
    onEscape: () => setSelectedSpill(null),
    onHelp: () => setIsShortcutsHelpOpen(prev => !prev),
  });

  // Minimap control initialization
  const handleMapLoad = useCallback((evt: any) => {
    const map = evt.target;
    if (!map) return;

    try {
      map.addControl(
        new MinimapControl({
          width: '180px',
          height: '130px',
          zoomLevelOffset: -5,
          interactions: { drag: false, zoom: false },
          style: isDark ? DARK_STYLE : LIGHT_STYLE,
        }),
        'bottom-right'
      );
    } catch (e) {
      console.warn('Minimap control load warning:', e);
    }
  }, [isDark]);

  // Manage P2 MapLibre native layers with strict idempotent cleanup (#1)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const cleanupLayers = () => {
      removeSpillPolygon(map);
      removeSourceRadius(map);
      removePulsingOrigin(map, 'origin-pulse');
      removeDriftTrajectory(map);
      removeVesselMarkers(map);
    };

    if (!selectedSpill) {
      cleanupLayers();
      return;
    }

    const originLat = spillDetail?.estimated_source_latitude || selectedSpill.centroid.lat;
    const originLon = spillDetail?.estimated_source_longitude || selectedSpill.centroid.lon;
    const radiusKm = spillDetail?.estimated_source_radius_km || 5;

    // Remove existing before re-adding to prevent duplicates
    cleanupLayers();

    // 1. Polygon layer
    if (spillDetail && spillDetail.polygon) {
      addSpillPolygon(map, spillDetail);
    }

    // 2. Source uncertainty radius
    addSourceRadius(map, originLat, originLon, radiusKm);

    // 3. Pulsing origin dot
    addPulsingOrigin(map, 'origin-pulse', [originLon, originLat]);

    // 4. Drift trajectory
    if (visualization) {
      addDriftTrajectory(map, visualization);
    }

    // 5. Suspect vessel markers
    if (vessels && vessels.length > 0) {
      addVesselMarkers(map, vessels, originLat, originLon);
    }

    return () => {
      cleanupLayers();
    };
  }, [selectedSpill?.spill_id, spillDetail, visualization, vessels]);

  // Create spill pin markers layer (IconLayer with teardrop pins) — isolated to activeSpills
  const pinLayer = useMemo(() => {
    return createSpillPinLayer(activeSpills, handleSelectSpill);
  }, [activeSpills, handleSelectSpill]);

  // Deck.gl overview layers (memoized #6)
  const layers = useMemo(() => {
    const baseProps = {
      data: activeSpills,
      pickable: true,
      onClick: (info: any) => info.object && handleSelectSpill(info.object),
    };

    // Heatmap layer
    const heatmap = new HeatmapLayer({
      id: 'spill-heatmap',
      ...baseProps,
      getPosition: (d: SpillEvent) => [d.centroid.lon, d.centroid.lat],
      getWeight: (d: SpillEvent) => d.area_km2,
      radiusPixels: 60,
      intensity: 1,
      threshold: 0.1,
      colorRange: [
        [255, 255, 178],
        [254, 204, 92],
        [253, 141, 60],
        [240, 59, 32],
        [189, 0, 38]
      ],
      visible: viewMode === 'heatmap'
    });

    // Text labels for selected
    const labels = new TextLayer({
      id: 'spill-labels',
      data: selectedSpill ? [selectedSpill] : [],
      getPosition: (d: SpillEvent) => [d.centroid.lon, d.centroid.lat],
      getText: (d: SpillEvent) => d.spill_id.replace('spill_', ''),
      getSize: 12,
      getColor: [255, 255, 255, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      getYOffset: -20
    });

    const activeEnvLayers = showWind ? envLayers : [];
    const activeWindArrows = showWind ? windArrowsLayers : [];
    const activeVesselTrackLayers = vesselTrackLayers;
    const activePins = (viewMode === 'markers' || viewMode === 'clusters') ? [pinLayer] : [];

    return [heatmap, labels, ...activePins, ...activeEnvLayers, ...activeWindArrows, ...activeVesselTrackLayers];
  }, [activeSpills, viewMode, selectedSpill, pinLayer, envLayers, windArrowsLayers, vesselTrackLayers, showWind, handleSelectSpill]);

  // Sidebar component for ResponsiveLayout
  const sidebar = selectedSpill ? (
    <SlideInPanel
      spill={spillDetail}
      vessels={vessels}
      viz={visualization}
      loading={detailLoading}
      onClose={() => setSelectedSpill(null)}
    />
  ) : null;

  // Controls component for ResponsiveLayout
  const controls = showHUD ? (
    <div className="flex flex-col gap-2">
      <StatsHUD spills={spills} selectedDate={selectedDate} />
    </div>
  ) : null;

  // Timeline component for ResponsiveLayout
  const timeline = (
    <PlaybackTimeline
      spills={spills}
      activeSpillId={selectedSpill?.spill_id}
      onSelectSpill={handleSelectSpill}
    />
  );

  return (
    <ResponsiveLayout sidebar={sidebar} controls={controls} timeline={timeline}>
      {/* Main Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        style={{ width: '100%', height: '100%' }}
        mapStyle={isDark ? DARK_STYLE : LIGHT_STYLE}
        maxBounds={[20, 30, 28, 40]}
      >
        <NavigationControl position="top-right" />
        {/* Deck.gl Overlay */}
        <DeckGLOverlay layers={layers} />

        {/* P3 GPU Wind Particle Flow */}
        {selectedSpill && visualization?.environment && showWind && (
          <WindOverlay
            wind={visualization.environment.wind}
            current={visualization.environment.current}
            spillCenter={{
              lon: visualization.spill.longitude,
              lat: visualization.spill.latitude,
            }}
            visible={showWind}
            particleCount={6000}
          />
        )}
      </Map>

      {/* Layer Toggle - Top Right */}
      <LayerToggle
        mode={viewMode}
        onModeChange={setViewMode}
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
        showWind={showWind}
        onWindToggle={() => setShowWind(!showWind)}
      />

      {/* Floating Environment HUD (P2) */}
      <EnvironmentHUD viz={visualization} visible={showHUD} />

      {/* Vessel Playback Controls (P4) */}
      {selectedSpill && showHUD && (
        <VesselControls
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          currentTime={playbackTime}
          spillTime={new Date(selectedSpill.detected_at).getTime()}
          vesselCount={tracks.length}
          showTrails={showTrails}
          onToggleTrails={() => setShowTrails(!showTrails)}
        />
      )}

      {/* Keyboard Shortcuts Help Modal (P6) */}
      <ShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />

      {/* Loading & Error Overlays */}
      {listLoading && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-50">
          <div className="text-white flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            Loading spills...
          </div>
        </div>
      )}

      {listError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500/50 text-red-200 px-4 py-2 rounded-xl text-sm z-50 shadow-xl">
          ⚠️ {listError}
        </div>
      )}
    </ResponsiveLayout>
  );
}

export default LiveMapPage;
