import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import * as turf from '@turf/turf';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { MAP_CONFIG } from './mapConfig';
import type { BasemapMode } from './mapConfig';
import {
  flyToSpill,
  frameDriftPath,
  resetToGlobe,
  revealSpillRegion,
  frameOriginAndVessel,
  flyToVessel,
  closeUpOnVessel,
  VESSEL_REVEAL_DURATIONS_MS,
} from './cameraController';
import { useTheme } from '../../../hooks/useTheme';
import { BasemapSelector } from '../controls/BasemapSelector';
import { EnvironmentToggles } from '../controls/EnvironmentToggles';
import { OceanFlowToggleButton } from '../controls/OceanFlowToggleButton';
import { InvestigationPanel } from '../controls/InvestigationPanel';
import { VesselReasoningPanel } from '../controls/VesselReasoningPanel';
import { InvestigationTimeline } from '../controls/InvestigationTimeline';
import { SpillDetailsSection } from '../drawers/SpillDetailsSection';
// import { SpillLegend } from '../controls/SpillLegend';
import { SpillStatusBadge } from '../controls/SpillStatusBadge';
import { createDeckOverlay } from '../deck/DeckOverlay';
import { buildDriftLayers } from '../deck/deckLayers';
import { createSpillLayers } from '../layers/SpillLayer';
import { createVesselLayers } from '../layers/VesselLayer';
import { createVesselRevealLayers } from '../layers/VesselInvestigationLayer';
import { useVesselRevealStage } from '../investigation/useVesselRevealStage';
import type { VesselRevealStage } from '../investigation/useVesselRevealStage';
import { createEnvironmentLayers } from '../layers/EnvironmentLayer';
import { useOceanFlow } from '../hooks/useOceanFlow';
import { getSpillBounds } from '../adapters/spillAdapter';
import { useSpills } from '../hooks/useSpills';
import { useSpillTrajectory } from '../hooks/useSpillTrajectory';
import { useSpillForecast } from '../hooks/useSpillForecast';
import { useSpillAttribution } from '../hooks/useSpillAttribution';
import { useSpillDetails } from '../hooks/useSpillDetails';
import { useInvestigation } from '../investigation/useInvestigation';
import { useInvestigationTimeline } from '../timeline/useInvestigationTimeline';
import type { PlaybackMode } from '../timeline/useInvestigationTimeline';
import type { InvestigationMode } from '../deck/deckLayers';
import { loadCoastline } from '../config/coastlineConfig';
import type { CoastlineGeoJSON } from '../utils/coastalAlert';
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
import { removeTimeTickMarkers, updateTimeTickMarkers } from './timeTickMarkers';
import type { TimeTickMarkerDatum } from './timeTickMarkers';
import { removeVesselRevealMarker, updateVesselRevealMarker } from './vesselRevealMarker';
import { removeDistanceRuler, updateDistanceRuler } from './vesselDistanceRuler';
import { selectTimeTicks, driftColorCssAt, driftProgress } from '../layers/trajectoryEncoding';
import { selectForecastTimeTicks, forecastColorCssAt, forecastProgress } from '../layers/forecastEncoding';
import { formatUtcTimestamp } from '../utils/formatSpill';

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
  /** Which drift geometry to show: backtracked (existing, default) or forward forecast (new). */
  const [investigationMode, setInvestigationMode] = useState<InvestigationMode>('backtrack');
  /**
   * Current map zoom, tracked so `createForecastLayers` can re-derive the
   * heatmap kernel's `radiusPixels` on every zoom change — see
   * `forecastEncoding.ts`'s `heatmapRadiusPixelsForZoom` for why a fixed
   * pixel radius alone lets gaps reopen between points once you zoom in.
   */
  const [zoom, setZoom] = useState(MAP_CONFIG.initialCamera.zoom);
  /**
   * True while the camera is actively panning/zooming/rotating. Only consumed
   * by the forecast heatmap layer (see `ForecastLayer.ts`'s `isInteracting`)
   * to drop its expensive per-frame GPU aggregation for the gesture's
   * duration — cheap to keep as plain state since it only flips twice per
   * gesture (movestart/moveend), not once per frame.
   */
  const [isCameraInteracting, setIsCameraInteracting] = useState(false);
  /**
   * Collapses the right-hand investigation sidebar without clearing the
   * investigation itself — separate from `handleClearInvestigation`'s "X",
   * which deselects the spill entirely. Reset to open on every new selection
   * (see the effect below) so clicking any dot always opens the panel fresh,
   * matching the brief's "same on any dot click" — a collapse only sticks
   * for the currently-selected spill, not future ones.
   */
  const [isInvestigationPanelOpen, setIsInvestigationPanelOpen] = useState(true);

  const oceanFlow = useOceanFlow(theme);

  const { spills, isLoading: isSpillsLoading, error: spillsError, reload } = useSpills();
  const { selectedSpillId, focusMode, selectSpill, clearInvestigation, toggleFocusMode } =
    useInvestigation();

  useEffect(() => {
    setIsInvestigationPanelOpen(true);
  }, [selectedSpillId]);

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

  // Only fetched while forecast mode is actually armed — backtrack mode never
  // requests it, so switching between spills in backtrack mode costs nothing extra.
  const {
    forecast,
    isLoading: isForecastLoading,
    error: forecastError,
  } = useSpillForecast(investigationMode === 'forecast' ? selectedSpillId : null);

  // Coastline extract for forecast mode's coastal-alert readout (see
  // `coastalAlert.ts`), loaded whenever forecast mode arms. State, not a ref:
  // the InvestigationPanel's coastal-alert banner renders from it.
  const [coastline, setCoastline] = useState<CoastlineGeoJSON | null>(null);
  useEffect(() => {
    if (investigationMode !== 'forecast' || !selectedSpillId) {
      setCoastline(null);
      return;
    }

    let active = true;
    loadCoastline('mediterranean').then((loaded) => {
      if (active) setCoastline(loaded);
    });

    return () => {
      active = false;
    };
  }, [investigationMode, selectedSpillId]);

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

  // --- "Who did this" vessel reveal — fires once the investigation timeline
  // finishes playing (never on a manual scrub to the end) — see the
  // isPlaying-edge effect and the choreography effect further below, and
  // `useVesselRevealStage.ts` for why this is split into pure stage state vs
  // the camera side effects that drive it.
  const rank1Vessel = useMemo(
    () => attribution?.vessels.find((v) => v.rank === 1) ?? null,
    [attribution]
  );
  const vesselReveal = useVesselRevealStage(selectedSpillId);
  const wasTimelinePlayingRef = useRef(false);

  useEffect(() => {
    const finishedNaturally =
      wasTimelinePlayingRef.current && !timeline.isPlaying && timeline.progress >= 1;
    wasTimelinePlayingRef.current = timeline.isPlaying;

    if (
      finishedNaturally &&
      backtrackActive &&
      trajectory?.source &&
      rank1Vessel?.culpritLocation
    ) {
      vesselReveal.start();
    }
    // vesselReveal itself is a fresh object every render; vesselReveal.start is the
    // one stable (useCallback) piece this effect actually calls, and is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.isPlaying, timeline.progress, backtrackActive, trajectory, rank1Vessel, vesselReveal.start]);

  // Camera choreography: one real camera move per stage (see cameraController.ts's
  // "Vessel-reveal choreography" section for why every beat moves the camera,
  // not just the first and last), each one scheduling the next stage once its
  // flight duration elapses.
  useEffect(() => {
    const map = mapRef.current;
    const stage = vesselReveal.stage;
    if (!map || stage === 'idle' || stage === 'done') return;
    if (!trajectory?.source || !rank1Vessel?.culpritLocation) return;

    const origin: [number, number] = [trajectory.source.longitude, trajectory.source.latitude];
    const vessel: [number, number] = [
      rank1Vessel.culpritLocation.longitude,
      rank1Vessel.culpritLocation.latitude,
    ];
    const SETTLE_BUFFER_MS = 150;

    let timeoutId: number | null = null;
    const scheduleNext = (next: VesselRevealStage, durationMs: number) => {
      timeoutId = window.setTimeout(() => vesselReveal.advance(next), durationMs + SETTLE_BUFFER_MS);
    };

    if (stage === 'framing') {
      frameOriginAndVessel(map, origin, vessel, 'wide');
      scheduleNext('ship', VESSEL_REVEAL_DURATIONS_MS.framing);
    } else if (stage === 'ship') {
      flyToVessel(map, vessel);
      scheduleNext('distance', VESSEL_REVEAL_DURATIONS_MS.ship);
    } else if (stage === 'distance') {
      frameOriginAndVessel(map, origin, vessel, 'settle');
      scheduleNext('closeup', VESSEL_REVEAL_DURATIONS_MS.distance);
    } else if (stage === 'closeup') {
      closeUpOnVessel(map, vessel);
      scheduleNext('done', VESSEL_REVEAL_DURATIONS_MS.closeup);
    }

    return () => {
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
    // vesselReveal itself is a fresh object every render; vesselReveal.stage/.advance
    // are the stable pieces this effect actually reads/calls, and are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vesselReveal.stage, vesselReveal.advance, trajectory, rank1Vessel]);

  // Vessel info card beside the ship — name, MMSI, type, speed and distance/
  // time-offset all at the spill-release moment (`culpritLocation`, not a
  // live reading) — see vesselRevealMarker.ts for why this is its own marker
  // rather than the single-line time-tick badge.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const showCard = vesselReveal.stage === 'distance' || vesselReveal.stage === 'closeup' || vesselReveal.stage === 'done';
    if (!showCard || !rank1Vessel?.culpritLocation) {
      removeVesselRevealMarker(map);
      return;
    }

    updateVesselRevealMarker(map, {
      longitude: rank1Vessel.culpritLocation.longitude,
      latitude: rank1Vessel.culpritLocation.latitude,
      vesselName: rank1Vessel.vesselName,
      mmsi: rank1Vessel.mmsi,
      vesselType: rank1Vessel.vesselType,
      speedKnots: rank1Vessel.culpritLocation.speed,
      distanceKm: rank1Vessel.distanceFromOriginKm,
      timeOffsetHours: rank1Vessel.timeDifferenceHours,
      withinRadius: attribution?.withinBacktrackRadius ?? null,
    });

    return () => {
      removeVesselRevealMarker(map);
    };
  }, [vesselReveal.stage, rank1Vessel, attribution?.withinBacktrackRadius]);

  // Origin/vessel distance ruler — colour-coded endpoint dots plus running
  // "Nkm" scale labels along the same dashed line VesselInvestigationLayer.ts
  // draws in deck.gl. Armed by the same stages as that line (see its
  // `showLine` there) so the two always appear and disappear together.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const showRuler = vesselReveal.stage === 'distance' || vesselReveal.stage === 'closeup' || vesselReveal.stage === 'done';
    if (!showRuler || !trajectory?.source || !rank1Vessel?.culpritLocation) {
      removeDistanceRuler(map);
      return;
    }

    updateDistanceRuler(map, {
      origin: { longitude: trajectory.source.longitude, latitude: trajectory.source.latitude },
      vessel: {
        longitude: rank1Vessel.culpritLocation.longitude,
        latitude: rank1Vessel.culpritLocation.latitude,
      },
      distanceKm: rank1Vessel.distanceFromOriginKm ?? 0,
    });

    return () => {
      removeDistanceRuler(map);
    };
  }, [vesselReveal.stage, trajectory?.source, rank1Vessel]);

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

      // Zoom feeds the forecast heatmap's radius re-derivation (see the
      // `zoom` state declaration above). `zoomend` rather than `zoom`: the
      // latter fires on every animation frame of a zoom gesture or flyTo, and
      // rebuilding the whole deck.gl layer stack that often would be wasteful
      // — the heatmap only needs to be right once the camera settles.
      map.on('zoomend', () => setZoom(map.getZoom()));

      // See `isCameraInteracting`'s doc comment above — covers pan, zoom,
      // rotate and flyTo alike, so the forecast heatmap drops out for any of
      // them, not just an explicit zoom gesture.
      map.on('movestart', () => setIsCameraInteracting(true));
      map.on('moveend', () => setIsCameraInteracting(false));

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

  // --- deck.gl layer stack, split into independently memoized pieces ---
  // Zoom only affects driftLayers (the forecast heatmap's kernel radius has
  // no geographic-unit option — see `forecastEncoding.ts`), so it's kept out
  // of every other memo's dependencies. Before this split, `zoom` lived on
  // one combined effect that rebuilt the whole stack, so every zoom tick
  // also rebuilt the ~377 spill markers and vessel tracks — that's what made
  // zooming feel laggy while a forecast was active.
  const environmentLayers = useMemo(
    () =>
      createEnvironmentLayers({
        environment,
        showWind: windVisible,
        showCurrent: currentVisible,
      }),
    [environment, windVisible, currentVisible]
  );

  const driftLayers = useMemo(
    () =>
      buildDriftLayers({
        investigationMode,
        trajectory,
        visiblePoints: backtrackActive ? timeline.visiblePoints : null,
        oilPlayhead: backtrackActive ? timeline.oilPosition : null,
        playbackMode,
        forecast,
        zoom,
        isInteracting: isCameraInteracting,
      }),
    [
      investigationMode,
      trajectory,
      backtrackActive,
      timeline.visiblePoints,
      timeline.oilPosition,
      playbackMode,
      forecast,
      zoom,
      isCameraInteracting,
    ]
  );

  const vesselLayers = useMemo(
    () =>
      createVesselLayers({
        vessels: attribution?.drawableVessels ?? [],
        vesselPositions: timeline.vesselPositions,
        backtrackActive,
        hideMovingMarker: vesselReveal.stage !== 'idle',
      }),
    [attribution, timeline.vesselPositions, backtrackActive, vesselReveal.stage]
  );

  const vesselRevealLayers = useMemo(
    () =>
      createVesselRevealLayers({
        stage: vesselReveal.stage,
        origin: trajectory?.source ?? null,
        vessel: rank1Vessel,
        useShipMesh: true,
        zoom,
      }),
    // zoom is cheap to depend on here (unlike spillLayers/vesselLayers — see
    // the "Zoom only affects driftLayers" note below): this memo only ever
    // rebuilds a single ship mesh instance plus a couple of short PathLayers,
    // not hundreds of markers, so re-deriving `sizeScale` every zoom tick
    // doesn't reintroduce the lag that split zoom out of the other memos.
    [vesselReveal.stage, trajectory, rank1Vessel, zoom]
  );

  const spillLayers = useMemo(
    () =>
      createSpillLayers({
        spills,
        selectedSpillId,
        selectedSpill,
        focusMode,
        onSelectSpill: selectSpill,
        backtrackActive,
      }),
    [spills, selectedSpillId, selectedSpill, focusMode, selectSpill, backtrackActive]
  );

  // --- Push the deck.gl layer stack whenever any of the above change ---
  // Paint order (bottom → top): ocean flow particles → environment arrows →
  // drift geometry → vessel tracks/markers → spill dots.
  useEffect(() => {
    const overlay = deckOverlayRef.current;
    if (!overlay || isLoading) return;

    overlay.setProps({
      layers: [
        ...oceanFlow.layers,
        ...environmentLayers,
        ...driftLayers,
        ...vesselLayers,
        ...vesselRevealLayers,
        ...spillLayers,
      ],
    });
  }, [oceanFlow.layers, environmentLayers, driftLayers, vesselLayers, vesselRevealLayers, spillLayers, isLoading]);

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
  // Bounds come from whichever geometry is actually on screen for the active
  // mode — the forecast's own bounds in 'forecast' mode, not the backtrack
  // trajectory's, so a forecast with a very different reach (a stalled 0.3km
  // creep vs. a 40km run) still lands fully framed instead of reusing a box
  // sized for the backtracked path. Keyed by mode as well as spill id so
  // switching modes for the same spill reframes too, not just switching spills.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSpillId) return;

    const bounds =
      investigationMode === 'forecast' ? (forecast?.bounds ?? null) : (trajectory?.bounds ?? null);
    if (!bounds) return;

    const framedKey = `${selectedSpillId}:${investigationMode}`;
    if (framedDriftForRef.current === framedKey) return;
    framedDriftForRef.current = framedKey;
    frameDriftPath(map, bounds);
  }, [trajectory, forecast, selectedSpillId, investigationMode]);

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

  // "T-Nh"/"T+Nh" time-tick badges, plus the path endpoints (Probable
  // source/Detection for backtrack, Now/Predicted position for forecast).
  // Rendered as `maplibregl.Marker` HTML pill badges — see timeTickMarkers.ts
  // for why this can't be a deck.gl TextLayer on this map, and why it's HTML
  // markers rather than a maplibre symbol layer. Each badge's colour is
  // sampled from the same gradient its path uses at that point, so the badge
  // always agrees with the path under it. Only one of backtrack/forecast is
  // ever active, so both branches share one marker set.
  const timeTickLabelData = useMemo<TimeTickMarkerDatum[]>(() => {
    if (investigationMode === 'forecast') {
      if (!forecast || forecast.points.length < 2) return [];
      const first = forecast.points[0];
      const last = forecast.points[forecast.points.length - 1];
      const ticks = selectForecastTimeTicks(forecast.points);
      return [
        {
          longitude: first.longitude,
          latitude: first.latitude,
          title: 'NOW',
          color: forecastColorCssAt(0),
          variant: 'endpoint',
        },
        ...ticks.map((tick) => ({
          longitude: tick.longitude,
          latitude: tick.latitude,
          title: `T+${Math.round(tick.hoursFromNow)}h`,
          color: forecastColorCssAt(forecastProgress(tick)),
          variant: 'tick' as const,
        })),
        {
          longitude: last.longitude,
          latitude: last.latitude,
          title: 'PREDICTED POSITION',
          color: forecastColorCssAt(1),
          variant: 'endpoint',
        },
      ];
    }

    if (!trajectory || trajectory.points.length < 2) return [];
    const oldest = trajectory.points[0];
    const newest = trajectory.points[trajectory.points.length - 1];
    // Same clip the tick dots use (TrajectoryLayer.ts): only label ticks the
    // playhead has already reached, so badges appear in lockstep with dots
    // while scrubbing instead of spoiling ticks still ahead of the playhead.
    const pointsForPath =
      backtrackActive && timeline.visiblePoints && timeline.visiblePoints.length >= 2
        ? timeline.visiblePoints
        : trajectory.points;
    const ticks = selectTimeTicks(trajectory.points).filter((tick) =>
      pointsForPath.some((p) => p.timestampMs >= tick.timestampMs)
    );
    // Same fallback InvestigationPanel's "Est. release" field uses: the
    // backend's own estimate when it has one, else the backtracked path's
    // own oldest sample — so the map badge and the panel never disagree.
    const releaseTimeMs = selectedSpill?.estimatedReleaseTime
      ? Date.parse(selectedSpill.estimatedReleaseTime)
      : oldest.timestampMs;
    return [
      {
        longitude: oldest.longitude,
        latitude: oldest.latitude,
        title: 'PROBABLE SOURCE',
        subtitle: formatUtcTimestamp(releaseTimeMs),
        color: driftColorCssAt(0),
        variant: 'endpoint',
      },
      ...ticks.map((tick) => ({
        longitude: tick.longitude,
        latitude: tick.latitude,
        title: `T-${Math.round(tick.hoursBeforeDetection)}h`,
        color: driftColorCssAt(driftProgress(tick, trajectory.durationHours)),
        variant: 'tick' as const,
      })),
      {
        longitude: newest.longitude,
        latitude: newest.latitude,
        title: 'DETECTION',
        subtitle: formatUtcTimestamp(newest.timestampMs),
        color: driftColorCssAt(1),
        variant: 'endpoint',
      },
    ];
  }, [
    investigationMode,
    forecast,
    trajectory,
    backtrackActive,
    timeline.visiblePoints,
    selectedSpill?.estimatedReleaseTime,
  ]);

  const hasTimeTickLabels = timeTickLabelData.length > 0;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hasTimeTickLabels) {
      removeTimeTickMarkers('drift', map);
      return;
    }

    updateTimeTickMarkers(map, 'drift', timeTickLabelData);

    return () => {
      removeTimeTickMarkers('drift', map);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial paint only; live content updates handled by the effect below.
  }, [hasTimeTickLabels]);

  // Push content changes (e.g. a new tick badge revealed by scrubbing) into
  // a fresh marker set — same pattern as the focus polygon above.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasTimeTickLabels) return;
    updateTimeTickMarkers(map, 'drift', timeTickLabelData);
  }, [timeTickLabelData, hasTimeTickLabels]);

  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (investigationMode === 'forecast' && forecast) {
      frameDriftPath(map, forecast.bounds);
      return;
    }
    if (trajectory) {
      frameDriftPath(map, trajectory.bounds);
      return;
    }
    if (selectedSpill) flyToSpill(map, selectedSpill);
  }, [selectedSpill, trajectory, forecast, investigationMode]);

  const handleResetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    clearInvestigation();
    setBacktrackSpillId(null);
    setPlaybackMode('forward');
    setInvestigationMode('backtrack');
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

  // Forecast and the vessel-investigation timeline are mutually exclusive
  // stories on the map: the timeline and its Focus Mode polygon are both
  // driven by `trajectory`, and would keep rendering underneath an unrelated
  // forecast path if left armed. Disarming through the same toggle the button
  // itself uses keeps this identical to a manual click, not a parallel code path.
  useEffect(() => {
    if (investigationMode === 'forecast' && backtrackActive) {
      handleToggleBacktrack();
    }
  }, [investigationMode, backtrackActive, handleToggleBacktrack]);

  const handleClearInvestigation = useCallback(() => {
    clearInvestigation();
    setBacktrackSpillId(null);
    setPlaybackMode('forward');
    setInvestigationMode('backtrack');
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
      <div className="maritime-map-body flex w-full min-w-0 flex-1 flex-col">
        <div ref={wrapperRef} className="maritime-map-wrapper relative min-w-0 flex-1">
          <BasemapSelector currentMode={basemapMode} onSelectMode={setBasemapMode} />

          <OceanFlowToggleButton
            visible={oceanFlow.visible}
            status={oceanFlow.status}
            error={oceanFlow.error}
            onToggle={oceanFlow.toggle}
            onRetry={oceanFlow.retry}
          />

          <SpillStatusBadge
            spillCount={spills.length}
            isLoading={isSpillsLoading}
            error={spillsError}
            onRetry={reload}
            onResetView={handleResetView}
          />

          {selectedSpill && environment && (
            <EnvironmentToggles
              environment={environment}
              showWind={windVisible}
              showCurrent={currentVisible}
              onToggleWind={() => setShowWind((v) => !v)}
              onToggleCurrent={() => setShowCurrent((v) => !v)}
            />
          )}

          {selectedSpill && backtrackActive && vesselReveal.stage !== 'idle' && (
            <button
              type="button"
              onClick={vesselReveal.start}
              className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-card-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-accent"
              title="Replay the vessel reconstruction"
            >
              <RotateCcw size={12} />
              Replay reconstruction
            </button>
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

          {/*
            Floating reopen tab — shown only once the panel's been collapsed
            (see the edge button inside the aside below). Sits over the map's
            now-reclaimed right edge, same circular-button language as the
            aside's own collapse control and the app shell's left Sidebar.
          */}
          {selectedSpill && !isInvestigationPanelOpen && (
            <button
              type="button"
              onClick={() => setIsInvestigationPanelOpen(true)}
              className="absolute right-3 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:scale-105 hover:bg-accent hover:text-foreground active:scale-95"
              title="Open investigation panel"
              aria-label="Open investigation panel"
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
            </button>
          )}

          {/*
            Floats on top of the map instead of taking its own column —
            keeps the map at full width regardless of whether this panel is
            open. The vessel-reveal sequence still takes over the same slot,
            InvestigationPanel auto-collapsing to its header while
            VesselReasoningPanel ("why rank #1") fills the rest underneath it.
          */}
          {selectedSpill && isInvestigationPanelOpen && (
            <aside className="absolute right-4 top-4 z-10 flex max-h-[calc(100%-2rem)] w-[min(320px,calc(100%-2rem))] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsInvestigationPanelOpen(false)}
                className="absolute -left-3 top-5 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:scale-105 hover:bg-accent hover:text-foreground active:scale-95"
                title="Hide investigation panel"
                aria-label="Hide investigation panel"
              >
                <ChevronRight size={13} strokeWidth={2.5} />
              </button>

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
                investigationMode={investigationMode}
                onSetInvestigationMode={setInvestigationMode}
                isForecastLoading={isForecastLoading}
                forecastError={forecastError}
                forecast={forecast}
                coastline={coastline}
                onToggleFocusMode={toggleFocusMode}
                onToggleBacktrack={handleToggleBacktrack}
                onClear={handleClearInvestigation}
                onRecenter={handleRecenter}
                onScrollToDetails={handleScrollToDetails}
                autoCollapse={vesselReveal.stage !== 'idle'}
              />

              {/*
                Sits below the (now auto-collapsed) InvestigationPanel header
                instead of replacing it — see InvestigationPanel's
                `autoCollapse` prop and VesselReasoningPanel's `flex-1`
                sizing, which is what leaves this the remaining height to fill.
              */}
              {vesselReveal.stage !== 'idle' && rank1Vessel && (
                <VesselReasoningPanel vessel={rank1Vessel} attribution={attribution} />
              )}
            </aside>
          )}
        </div>

        {/*
          Docked below the map instead of floating on top of it as an
          absolute overlay — same reasoning the investigation panels used to
          follow before they became a map overlay themselves above; this one
          stays docked so it doesn't cover the map's own drift-path visuals.
        */}
        {selectedSpill && backtrackActive && trajectory && (
          <div className="maritime-timeline-dock">
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
          </div>
        )}
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
