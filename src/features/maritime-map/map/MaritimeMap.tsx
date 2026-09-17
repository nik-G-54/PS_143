import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as turf from '@turf/turf';
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
import {
  buildOilSlickKeyframes,
  detectionHandoffOpacity,
  resolvePolygonAtProgress,
} from '../utils/oilSlickKeyframes';
import { DEFAULT_VERTEX_COUNT } from '../utils/organicPolygon';
import {
  addFocusPolygon,
  updateFocusPolygon,
  removeFocusPolygon,
} from '../../../components/map/layers/DriftTrajectory';

// Explicitly set the worker URL using Vite's ?worker&url syntax
// This fixes the 'maplibre-gl-worker.mjs does not exist in optimize deps' error
maplibregl.setWorkerUrl(workerUrl);

export function MaritimeMap() {
  const wrapperRef = useRef<HTMLDivElement>(null);
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

  const focusPoints = useMemo(
    () =>
      trajectory?.points.map((p) => ({
        longitude: p.longitude,
        latitude: p.latitude,
        timestamp: p.timestamp,
      })) ?? null,
    [trajectory]
  );

  // Organic oil-slick polygon ("Focus Mode") keyframes — precomputed once per
  // trajectory identity, then resolved at InvestigationTimeline's own
  // progress/playbackMode on every render (play tick AND manual scrub alike).
  // No separate animation loop: this is purely derived state.
  const oilSlickKeyframes = useMemo(() => {
    if (!focusPoints || focusPoints.length === 0) return null;
    return buildOilSlickKeyframes(
      focusPoints,
      selectedSpill?.estimatedSourceRadiusKm ?? trajectory?.source?.radiusKm ?? null,
      selectedSpill?.areaKm2 ?? null,
      selectedSpillId ?? 'focus',
      DEFAULT_VERTEX_COUNT
    );
  }, [focusPoints, selectedSpill, trajectory, selectedSpillId]);

  const focusPolygonRing = useMemo(
    () => resolvePolygonAtProgress(oilSlickKeyframes, timeline.progress, playbackMode),
    [oilSlickKeyframes, timeline.progress, playbackMode]
  );

  // Opacity multiplier (0..1) for the TRAVELING focus polygon only — fades it
  // out in the last stretch of the approach to detection (and, symmetrically,
  // fades it in as backtrack departs from detection) so it hands off visually
  // to the always-on static authoritative polygon layer (SpillLayer.ts)
  // underneath instead of the two ever rendering the same shape on top of
  // each other. See oilSlickKeyframes.ts's `detectionHandoffOpacity`. Pure
  // function of (progress, playbackMode), recomputed on every render, so
  // manual slider drags fade identically to playback.
  const focusPolygonOpacity = useMemo(
    () => detectionHandoffOpacity(timeline.progress, playbackMode),
    [timeline.progress, playbackMode]
  );

  // Diagnostic only: cross-check the trajectory's own detection-end point
  // against the spill detail's observation_latitude/observation_longitude.
  // These come from two different backend endpoints (visualization vs
  // demo/spills detail) that are expected to describe the same detection
  // event. This never changes which keyframe is treated as "detection" —
  // that's always the trajectory's own last point (oldest->newest order,
  // see oilSlickKeyframes.ts) — it only reports a mismatch so a real
  // data-alignment problem between the two sources doesn't go unnoticed.
  useEffect(() => {
    if (!trajectory || trajectory.points.length === 0) return;
    const obsLon = selectedSpill?.observationLongitude;
    const obsLat = selectedSpill?.observationLatitude;
    if (obsLon == null || obsLat == null) return;

    const detectionPoint = trajectory.points[trajectory.points.length - 1];
    const distanceKm = turf.distance(
      [detectionPoint.longitude, detectionPoint.latitude],
      [obsLon, obsLat],
      { units: 'kilometers' }
    );

    const FLAG_THRESHOLD_KM = 0.05; // 50 m — a few meters is rounding noise, more than this is worth a look.
    if (distanceKm > FLAG_THRESHOLD_KM) {
      console.warn(
        `[MaritimeMap] trajectory detection-end point is ~${(distanceKm * 1000).toFixed(1)}m from spill detail's observation_latitude/observation_longitude for ${trajectory.spillId} — the two backend sources may be misaligned.`,
        { trajectoryPoint: detectionPoint, observation: { longitude: obsLon, latitude: obsLat } }
      );
    }
  }, [trajectory, selectedSpill]);

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

    let onFullscreenChange: (() => void) | null = null;

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

      // Fullscreen - target the wrapper element containing the map and all overlays
      map.addControl(
        new maplibregl.FullscreenControl({
          container: wrapperRef.current ?? undefined,
        }),
        'bottom-right'
      );

      onFullscreenChange = () => {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        }, 60);
      };

      document.addEventListener('fullscreenchange', onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', onFullscreenChange);

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
      if (onFullscreenChange) {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      }
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

  // Focus Mode polygon layer — armed by the SAME condition that renders the
  // InvestigationTimeline panel (backtrackActive + trajectory loaded), kept in
  // its own effect so add/remove never touches the deck.gl spill/trajectory
  // layers above. There is no independent animation loop: the ring is derived
  // (see `focusPolygonRing` above) straight from InvestigationTimeline's own
  // progress/playbackMode, so this effect only (re)adds the maplibre
  // source/layer pair when the panel arms or disarms.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!backtrackActive || !trajectory) {
      removeFocusPolygon(map);
      return;
    }

    addFocusPolygon(map);
    updateFocusPolygon(map, focusPolygonRing ? [focusPolygonRing] : null, focusPolygonOpacity);

    return () => {
      removeFocusPolygon(map);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial paint only; live updates handled by the effect below.
  }, [backtrackActive, trajectory]);

  // Push every progress change (play tick AND manual slider drag) into the
  // existing source — no re-add, matches the marching-ants update pattern.
  // Also re-applies the detection-handoff fade opacity on every change, since
  // it's a pure function of the same (progress, playbackMode) this effect
  // already depends on.
  useEffect(() => {
    if (!backtrackActive) return;
    const map = mapRef.current;
    if (!map) return;
    updateFocusPolygon(map, focusPolygonRing ? [focusPolygonRing] : null, focusPolygonOpacity);
  }, [backtrackActive, focusPolygonRing, focusPolygonOpacity]);

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
      <div ref={wrapperRef} className="maritime-map-wrapper relative min-h-[70vh] w-full flex-1">
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
            key={selectedSpill.spillId}
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
            speed={timeline.speed}
            onSpeedChange={timeline.setSpeed}
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
