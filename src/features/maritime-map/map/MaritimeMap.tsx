import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { MAP_CONFIG } from './mapConfig';
import type { BasemapMode } from './mapConfig';
import { flyToSpill, frameDriftPath, resetToGlobe, revealSpillRegion } from './cameraController';
import { useTheme } from '../../../hooks/useTheme';
import { BasemapSelector } from '../controls/BasemapSelector';
import { EnvironmentToggles } from '../controls/EnvironmentToggles';
import { InvestigationPanel } from '../controls/InvestigationPanel';
import { InvestigationTimeline } from '../controls/InvestigationTimeline';
import { SpillDetailsSection } from '../drawers/SpillDetailsSection';
// import { SpillLegend } from '../controls/SpillLegend';
import { SpillStatusBadge } from '../controls/SpillStatusBadge';
import { createDeckOverlay } from '../deck/DeckOverlay';
import { buildMaritimeLayers } from '../deck/deckLayers';
import { getSpillBounds } from '../adapters/spillAdapter';
import { useSpills } from '../hooks/useSpills';
import { useSpillTrajectory } from '../hooks/useSpillTrajectory';
import { useSpillAttribution } from '../hooks/useSpillAttribution';
import { useSpillDetails } from '../hooks/useSpillDetails';
import { useInvestigation } from '../investigation/useInvestigation';
import { useInvestigationTimeline } from '../timeline/useInvestigationTimeline';
import type { PlaybackMode } from '../timeline/useInvestigationTimeline';
import { MapboxOverlay } from '@deck.gl/mapbox';

// Explicitly set the worker URL using Vite's ?worker&url syntax
// This fixes the 'maplibre-gl-worker.mjs does not exist in optimize deps' error
maplibregl.setWorkerUrl(workerUrl);

export function MaritimeMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const framedDriftForRef = useRef<string | null>(null);
  const { theme } = useTheme();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [basemapMode, setBasemapMode] = useState<BasemapMode>('satellite');
  const [isStyleLoading, setIsStyleLoading] = useState(false);
  const [isTilesLoading, setIsTilesLoading] = useState(false);
  const [showWind, setShowWind] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  /** Spill id for which backtrack mode is armed — auto-clears when selection changes. */
  const [backtrackSpillId, setBacktrackSpillId] = useState<string | null>(null);
  /** Active playback direction — resets to forward whenever investigation is toggled or spill changes. */
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('forward');

  const { spills, isLoading: isSpillsLoading, error: spillsError, reload } = useSpills();
  const { selectedSpillId, focusMode, selectSpill, clearInvestigation, toggleFocusMode } =
    useInvestigation();

  const backtrackActive = backtrackSpillId != null && backtrackSpillId === selectedSpillId;

  const baseSelectedSpill = useMemo(
    () => spills.find((spill) => spill.spillId === selectedSpillId) ?? null,
    [spills, selectedSpillId]
  );

  const { spill: selectedSpill } = useSpillDetails(baseSelectedSpill);

  const {
    trajectory,
    environment,
    isLoading: isTrajectoryLoading,
    error: trajectoryError,
  } = useSpillTrajectory(selectedSpillId);

  const {
    attribution,
    isLoading: isAttributionLoading,
  } = useSpillAttribution(selectedSpillId, backtrackActive);

  const timeline = useInvestigationTimeline(
    trajectory,
    attribution?.drawableVessels ?? [],
    backtrackActive && Boolean(trajectory),
    playbackMode
  );

  // Environment toggles only apply while a spill is selected.
  const windVisible = Boolean(selectedSpill && showWind);
  const currentVisible = Boolean(selectedSpill && showCurrent);

  // Helper: apply globe projection to a map instance.
  // Must be called AFTER the style has finished loading (inside style.load).
  // This is the pattern used by the official MapLibre globe examples.
  const applyGlobeProjection = (map: maplibregl.Map) => {
    try {
      (map as any).setProjection({ type: 'globe' });
    } catch (err) {
      console.warn('Globe projection not available:', err);
    }
  };

  // --- Map initialization (runs once) ---
  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;

    try {
      const initialStyle = MAP_CONFIG.styles[basemapMode][theme];

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: [MAP_CONFIG.initialCamera.longitude, MAP_CONFIG.initialCamera.latitude],
        zoom: MAP_CONFIG.initialCamera.zoom,
        pitch: MAP_CONFIG.initialCamera.pitch,
        bearing: MAP_CONFIG.initialCamera.bearing,
        attributionControl: false,
        renderWorldCopies: false,
      });

      // Globe projection MUST be applied after style.load — this is the
      // official MapLibre pattern from their own globe examples.
      map.on('style.load', () => {
        applyGlobeProjection(map);
      });

      map.on('load', () => {
        setIsLoading(false);

        // Add Deck.gl overlay once map is loaded
        if (!deckOverlayRef.current) {
          const deckOverlay = createDeckOverlay();
          deckOverlayRef.current = deckOverlay;
          map.addControl(deckOverlay as unknown as maplibregl.IControl);
        }
      });

      // Navigation controls
      map.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true,
        }),
        'bottom-right'
      );

      // Fullscreen
      map.addControl(new maplibregl.FullscreenControl(), 'bottom-right');


      map.on('error', (e) => {
        console.error('MapLibre error:', e);
        if (e.error && e.error.message) {
          setError('Map could not be loaded.');
          setIsLoading(false);
          setIsStyleLoading(false);
        }
      });

      mapRef.current = map;
    } catch (e) {
      console.error('Failed to initialize MapLibre:', e);
      setError('Map could not be loaded.');
      setIsLoading(false);
    }

    return () => {
      if (deckOverlayRef.current && mapRef.current) {
        mapRef.current.removeControl(deckOverlayRef.current as unknown as maplibregl.IControl);
        deckOverlayRef.current.finalize();
        deckOverlayRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Style switching (theme or basemap change) ---
  // Seeded with the style handed to the constructor so the first run is a no-op.
  const appliedStyleKeyRef = useRef(`${basemapMode}:${theme}`);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    const styleKey = `${basemapMode}:${theme}`;
    if (styleKey === appliedStyleKeyRef.current) return;
    appliedStyleKeyRef.current = styleKey;

    setIsStyleLoading(true);
    // A style swap invalidates every tile, so wait for imagery too.
    setIsTilesLoading(true);

    // `diff: false` forces a full reload. MapLibre's default diffing path applies
    // the new style through Style.setState(), which never re-fires `style.load` —
    // that would strand the loader and skip re-applying the globe projection.
    // Vector Carto ↔ raster Esri is not meaningfully diffable anyway.
    map.setStyle(MAP_CONFIG.styles[basemapMode][theme], { diff: false });

    // style.load fires when the style JSON is fully parsed
    const onStyleLoad = () => {
      setIsStyleLoading(false);
      // Tiles may already be in cache from a previous visit to this style.
      if (map.areTilesLoaded()) {
        setIsTilesLoading(false);
      }
    };

    map.once('style.load', onStyleLoad);

    return () => {
      map.off('style.load', onStyleLoad);
    };
  }, [theme, basemapMode, isLoading]);

  // --- Tile loading tracker ---
  // We want to dismiss the loader once the tiles for the current viewport arrive.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const checkLoadingState = () => {
      if (map.isStyleLoaded() && map.areTilesLoaded()) {
        setIsTilesLoading(false);
      }
    };

    // 'sourcedata' fires when a tile finishes loading
    map.on('sourcedata', checkLoadingState);
    // 'styledata' fires when style changes
    map.on('styledata', checkLoadingState);

    return () => {
      map.off('sourcedata', checkLoadingState);
      map.off('styledata', checkLoadingState);
    };
  }, [isLoading]); // Attach after initial map load

  // --- Push the deck.gl layer stack whenever map state changes ---
  useEffect(() => {
    const overlay = deckOverlayRef.current;
    if (!overlay || isLoading) return;

    overlay.setProps({
      layers: buildMaritimeLayers({
        spills,
        selectedSpillId,
        selectedSpill,
        focusMode,
        onSelectSpill: selectSpill,
        trajectory,
        visiblePoints: backtrackActive ? timeline.visiblePoints : null,
        oilPlayhead: backtrackActive ? timeline.oilPosition : null,
        environment,
        showWind: windVisible,
        showCurrent: currentVisible,
        vessels: attribution?.drawableVessels ?? [],
        vesselPositions: timeline.vesselPositions,
        backtrackActive,
        playbackMode,
      }),
    });
  }, [
    spills,
    selectedSpillId,
    selectedSpill,
    focusMode,
    selectSpill,
    isLoading,
    trajectory,
    backtrackActive,
    playbackMode,
    timeline.visiblePoints,
    timeline.oilPosition,
    timeline.vesselPositions,
    environment,
    windVisible,
    currentVisible,
    attribution,
  ]);

  // Clear framed-drift lock when the selection changes so the next path can reframe.
  useEffect(() => {
    framedDriftForRef.current = null;
  }, [selectedSpillId]);

  // --- Reveal the detection region once, after the first successful load ---
  // Every detection in the archive sits inside a box a few km across, which is
  // sub-pixel at the globe's opening zoom. Flying in is what makes the data visible.
  const hasRevealedRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading || hasRevealedRef.current) return;
    if (isSpillsLoading || spills.length === 0) return;

    const bounds = getSpillBounds(spills);
    if (!bounds) return;

    hasRevealedRef.current = true;
    revealSpillRegion(map, bounds);
  }, [spills, isSpillsLoading, isLoading]);

  // --- Camera follows the selection ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSpill) return;
    flyToSpill(map, selectedSpill);
  }, [selectedSpill]);

  // --- Second beat: frame the drift path once it arrives for this selection ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !trajectory || !selectedSpillId) return;
    if (framedDriftForRef.current === trajectory.spillId) return;
    framedDriftForRef.current = trajectory.spillId;
    frameDriftPath(map, trajectory.bounds);
  }, [trajectory, selectedSpillId]);

  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (trajectory) {
      frameDriftPath(map, trajectory.bounds);
      return;
    }
    if (selectedSpill) flyToSpill(map, selectedSpill);
  }, [selectedSpill, trajectory]);

  const handleResetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    clearInvestigation();
    setBacktrackSpillId(null);
    setPlaybackMode('forward');
    setShowWind(false);
    setShowCurrent(false);
    resetToGlobe(map);
    // Let the next successful load frame the region again.
    hasRevealedRef.current = false;
    framedDriftForRef.current = null;
  }, [clearInvestigation]);

  const handleToggleBacktrack = useCallback(() => {
    if (!selectedSpillId) return;
    setBacktrackSpillId((prev) => {
      const next = prev === selectedSpillId ? null : selectedSpillId;
      // Reset mode to forward whenever we arm or disarm.
      setPlaybackMode('forward');
      return next;
    });
  }, [selectedSpillId]);

  const handleClearInvestigation = useCallback(() => {
    clearInvestigation();
    setBacktrackSpillId(null);
    setPlaybackMode('forward');
    setShowWind(false);
    setShowCurrent(false);
    framedDriftForRef.current = null;
  }, [clearInvestigation]);

  const handleScrollToDetails = useCallback(() => {
    document.getElementById('spill-investigation-details')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  return (
    <div className="maritime-map-shell flex h-full min-h-0 w-full flex-col">
      <div className="maritime-map-wrapper relative min-h-[70vh] w-full flex-1">
        <BasemapSelector currentMode={basemapMode} onSelectMode={setBasemapMode} />

        <SpillStatusBadge
          spillCount={spills.length}
          isLoading={isSpillsLoading}
          error={spillsError}
          onRetry={reload}
          onResetView={handleResetView}
        />

        {selectedSpill && (
          <InvestigationPanel
            spill={selectedSpill}
            focusMode={focusMode}
            trajectory={trajectory}
            isTrajectoryLoading={isTrajectoryLoading}
            trajectoryError={trajectoryError}
            attribution={attribution}
            isAttributionLoading={isAttributionLoading}
            backtrackActive={backtrackActive}
            playbackMode={playbackMode}
            onSetPlaybackMode={setPlaybackMode}
            onToggleFocusMode={toggleFocusMode}
            onToggleBacktrack={handleToggleBacktrack}
            onClear={handleClearInvestigation}
            onRecenter={handleRecenter}
            onScrollToDetails={handleScrollToDetails}
          />
        )}

        {selectedSpill && environment && (
          <EnvironmentToggles
            environment={environment}
            showWind={windVisible}
            showCurrent={currentVisible}
            onToggleWind={() => setShowWind((v) => !v)}
            onToggleCurrent={() => setShowCurrent((v) => !v)}
          />
        )}

        {selectedSpill && backtrackActive && trajectory && (
          <InvestigationTimeline
            progress={timeline.progress}
            isPlaying={timeline.isPlaying}
            windowLabel={timeline.windowLabel}
            onTogglePlay={timeline.togglePlay}
            onSeek={timeline.setProgress}
            playbackMode={playbackMode}
            atSource={timeline.atSource}
          />
        )}

        {/* <SpillLegend /> */}

        {(isLoading || isStyleLoading || isTilesLoading) && !error && (
          <div className="maritime-map-loading">
            <span>
              {isLoading
                ? 'Initializing map…'
                : isStyleLoading
                  ? 'Loading style…'
                  : 'Loading imagery…'}
            </span>
          </div>
        )}

        {error && (
          <div className="maritime-map-error">
            <span>{error}</span>
          </div>
        )}

        <div ref={mapContainerRef} className="maritime-map-container" />
      </div>

      {selectedSpill && (
        <SpillDetailsSection
          spill={selectedSpill}
          trajectory={trajectory}
          environment={environment}
          attribution={attribution}
          isTrajectoryLoading={isTrajectoryLoading}
          isAttributionLoading={isAttributionLoading}
          currentTimeMs={timeline.currentTimeMs}
          backtrackActive={backtrackActive}
        />
      )}
    </div>
  );
}
