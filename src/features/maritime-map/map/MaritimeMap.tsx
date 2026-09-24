import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
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
import { OceanFlowLegend } from '../controls/OceanFlowLegend';
import { RegionInsetMap } from './RegionInsetMap';
import { AlertSeverityLegend } from '../controls/AlertSeverityLegend';
import { InvestigationPanel } from '../controls/InvestigationPanel';
import { MapTopBar, type TopBarModule } from '../controls/MapTopBar';
import { IncidentModule, ImageModule, TimeModule, VesselsModule } from '../controls/sidebarModules';
import { InvestigationTimeline } from '../controls/InvestigationTimeline';
import { EvidenceDashboard } from '../evidence/EvidenceDashboard';
import { useReportPreparation } from '../evidence/report/useReportPreparation';
// import { SpillLegend } from '../controls/SpillLegend';
import { createDeckOverlay } from '../deck/DeckOverlay';
import { buildDriftLayers } from '../deck/deckLayers';
import { createSpillLayers } from '../layers/SpillLayer';
import { createVesselLayers } from '../layers/VesselLayer';
import { createVesselRevealLayers } from '../layers/VesselInvestigationLayer';
import { useVesselRevealStage } from '../investigation/useVesselRevealStage';
import type { VesselRevealStage } from '../investigation/useVesselRevealStage';
import { createEnvironmentLayers } from '../layers/EnvironmentLayer';
import { createReferenceLayers } from '../layers/ReferenceLayer';
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
import { computeForecastAlertSeverity, ALERT_SEVERITY_CSS } from '../utils/coastalAlert';
import type { CoastlineGeoJSON } from '../utils/coastalAlert';
import { MapboxOverlay } from '@deck.gl/mapbox';
import {
  buildOilSlickKeyframes,
  DETECTION_HANDOFF_THRESHOLD,
  detectionHandoffOpacity,
  distanceFromDetection,
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
   * Which top-bar module card is open (null = toolbar only). Reset to the Investigation module on every new
   * selection (see the effect below) so clicking any dot always opens the
   * actions fresh — closing a module only sticks for the current spill.
   */
  const [activeModule, setActiveModule] = useState<TopBarModule | null>('investigation');
  /** Evidence dossier open: the map folds into the dossier's mini-map slot and the dossier rises over the page. */
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  /** Regional 2D inset grown to fill the map area (see RegionInsetMap.tsx). */
  const [insetExpanded, setInsetExpanded] = useState(false);
  /** Px of the map's right edge covered by the open top-bar module card — the timeline stops short of it. */
  const [rightInset, setRightInset] = useState(0);

  const oceanFlow = useOceanFlow(theme);

  const { spills, isLoading: isSpillsLoading, error: spillsError, reload } = useSpills();
  const { selectedSpillId, focusMode, selectSpill, clearInvestigation, toggleFocusMode } =
    useInvestigation();

  useEffect(() => {
    setActiveModule('investigation');
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
  } = useSpillForecast(investigationMode === 'forecast' || evidenceOpen ? selectedSpillId : null);

  // Coastline extract — doubles as forecast mode's coastal-alert readout
  // input (see `coastalAlert.ts`) and as the map's spatial-reference line
  // layer (see `ReferenceLayer.ts`). Loaded once on mount rather than gated
  // to forecast mode: a 76KB static asset, cheap to keep around, and the
  // reference layer should orient the eye whenever the map is on screen, not
  // only once an investigation is armed. State, not a ref: both the
  // InvestigationPanel's coastal-alert banner and the reference layer memo
  // render from it.
  const [coastline, setCoastline] = useState<CoastlineGeoJSON | null>(null);
  useEffect(() => {
    let active = true;
    loadCoastline('mediterranean').then((loaded) => {
      if (active) setCoastline(loaded);
    });

    return () => {
      active = false;
    };
  }, []);

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

  // Timeline scrub-track annotations, straight from the backend drift
  // samples: each end's real timestamp, and a notch per T-Nh tick (the same
  // samples `selectTimeTicks` badges on the map) placed at its progress.
  const timelineEnds = useMemo(() => {
    if (!trajectory || trajectory.points.length < 2) return null;
    const origin = formatUtcTimestamp(trajectory.points[0].timestampMs);
    const detection = formatUtcTimestamp(trajectory.points[trajectory.points.length - 1].timestampMs);
    return playbackMode === 'backtrack'
      ? { left: detection, right: origin }
      : { left: origin, right: detection };
  }, [trajectory, playbackMode]);

  const timelineMarks = useMemo(() => {
    if (!trajectory || trajectory.points.length < 2) return [];
    const startMs = trajectory.points[0].timestampMs;
    const endMs = trajectory.points[trajectory.points.length - 1].timestampMs;
    const span = endMs - startMs;
    if (!(span > 0)) return [];
    return selectTimeTicks(trajectory.points).map((tick) => ({
      position: playbackMode === 'backtrack' ? (endMs - tick.timestampMs) / span : (tick.timestampMs - startMs) / span,
      label: `T-${Math.round(tick.hoursBeforeDetection)}h`,
      title: formatUtcTimestamp(tick.timestampMs),
    }));
  }, [trajectory, playbackMode]);

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
  const isRevealing = vesselReveal.stage !== 'idle';

  // The reveal keeps the map clear: any open module card is put away so the
  // ship, drift path and origin are all visible. The Vessel details tool
  // carries an attention dot (see `highlighted` below) for anyone who wants
  // the "why rank #1" breakdown.
  useEffect(() => {
    if (isRevealing) setActiveModule(null);
  }, [isRevealing]);
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
      scheduleNext('closeup', VESSEL_REVEAL_DURATIONS_MS.ship);
    } else if (stage === 'closeup') {
      closeUpOnVessel(map, vessel);
      scheduleNext('distance', VESSEL_REVEAL_DURATIONS_MS.closeup);
    } else if (stage === 'distance') {
      // Last beat: settle back out to the wide origin+vessel frame so the
      // sequence ends zoomed OUT, not stuck on the tight close-up — see the
      // user report this reordering fixes ("last me camera zoom out hona
      // chahiye, ship pe zoom in nahi").
      frameOriginAndVessel(map, origin, vessel, 'settle');
      scheduleNext('done', VESSEL_REVEAL_DURATIONS_MS.distance);
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

    // Same release-time fallback the "PROBABLE SOURCE" badge and the Incident
    // module use, so all three agree.
    const releaseTimeMs = selectedSpill?.estimatedReleaseTime
      ? Date.parse(selectedSpill.estimatedReleaseTime)
      : (trajectory?.points[0]?.timestampMs ?? null);

    updateVesselRevealMarker(map, {
      longitude: rank1Vessel.culpritLocation.longitude,
      latitude: rank1Vessel.culpritLocation.latitude,
      rank: rank1Vessel.rank,
      vesselId: rank1Vessel.vesselId,
      vesselName: rank1Vessel.vesselName,
      mmsi: rank1Vessel.mmsi,
      imo: rank1Vessel.imo,
      vesselType: rank1Vessel.vesselType ?? rank1Vessel.shiptypeName,
      country: rank1Vessel.country,
      identifiersSynthetic: rank1Vessel.identifiersSynthetic,
      speedKnots: rank1Vessel.culpritLocation.speed ?? rank1Vessel.speed,
      courseDeg: rank1Vessel.culpritLocation.course ?? rank1Vessel.course,
      distanceKm: rank1Vessel.distanceFromOriginKm,
      releaseTimeMs: releaseTimeMs != null && Number.isFinite(releaseTimeMs) ? releaseTimeMs : null,
      timeOffsetHours: rank1Vessel.timeDifferenceHours,
      withinRadius: attribution?.withinBacktrackRadius ?? null,
      driftRadiusKm: attribution?.searchParameters?.driftUncertaintyRadiusKm ?? null,
    });

    return () => {
      removeVesselRevealMarker(map);
    };
  }, [vesselReveal.stage, rank1Vessel, attribution, selectedSpill?.estimatedReleaseTime, trajectory]);

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
  // Static detection slick only while the traveling one is at (or dissolving
  // into) the detection end — a boolean, so spill layers rebuild twice per
  // playthrough rather than every frame.
  const detectionPolygonVisible =
    !backtrackActive || distanceFromDetection(timeline.progress, playbackMode) <= DETECTION_HANDOFF_THRESHOLD;

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

  // MapLibre's own `trackResize` only listens to the window, so container
  // size changes from layout alone (e.g. the timeline dock appearing below)
  // would stretch the canvas. Resize the same map instance in place instead.
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => mapRef.current?.resize());
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

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
  // `environment.longitude/latitude` is the trajectory's own detection
  // point — in backtrack mode that's one endpoint of the path on screen, so
  // the wind/current arrow reads as anchored context. In forecast mode the
  // path runs forward from a different "now" position instead, so the same
  // arrow renders nowhere near it: an unlabeled, seemingly stray marker with
  // no visible line back to anything (the connecting line is only ~0.025°
  // long — easy to miss at the zoom a forecast path is usually framed at).
  // The EnvironmentToggles HUD buttons stay live in both modes (the
  // wind/current *readout* is still valid context) — only this on-map arrow
  // is suppressed, since it's the one thing that looks positionally wrong.
  const environmentLayers = useMemo(
    () =>
      createEnvironmentLayers({
        environment,
        showWind: windVisible && investigationMode !== 'forecast',
        showCurrent: currentVisible && investigationMode !== 'forecast',
      }),
    [environment, windVisible, currentVisible, investigationMode]
  );

  // Coastline + graticule — a static, non-interactive backdrop, so it's
  // memoized on `coastline` alone (it never depends on selection, zoom, or
  // investigation mode) and painted first (see paint-order comment below) so
  // every other layer sits visibly on top of it.
  const referenceLayers = useMemo(
    () => createReferenceLayers({ coastline, showGraticule: false }),
    [coastline]
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
        showDetectionPolygon: detectionPolygonVisible,
      }),
    [spills, selectedSpillId, selectedSpill, focusMode, selectSpill, backtrackActive, detectionPolygonVisible]
  );

  // --- Push the deck.gl layer stack whenever any of the above change ---
  // Paint order (bottom → top): coastline/graticule reference → ocean flow
  // particles → environment arrows → drift geometry → vessel tracks/markers
  // → spill dots.
  useEffect(() => {
    const overlay = deckOverlayRef.current;
    if (!overlay || isLoading) return;

    overlay.setProps({
      layers: [
        ...referenceLayers,
        ...oceanFlow.layers,
        ...environmentLayers,
        ...driftLayers,
        ...vesselLayers,
        ...vesselRevealLayers,
        ...spillLayers,
      ],
    });
  }, [referenceLayers, oceanFlow.layers, environmentLayers, driftLayers, vesselLayers, vesselRevealLayers, spillLayers, isLoading]);

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

  // Drives the predicted-position marker's colour below — see
  // `computeForecastAlertSeverity`'s doc comment for why this is shared with
  // `InvestigationPanel.tsx`'s coastal-alert banner rather than computed
  // twice.
  const coastalAlertSeverity = useMemo(
    () => computeForecastAlertSeverity(forecast, coastline),
    [forecast, coastline]
  );

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
          // "T+0" rather than a plain "NOW" — keeps the origin in the same
          // T+Nh numbering the mid-path ticks below and the endpoint at the
          // other end already use, instead of switching notation partway
          // through the badge set.
          title: 'T+0',
          subtitle: formatUtcTimestamp(first.timestampMs),
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
          // Reflects the coastal-alert severity at this position (see
          // `coastalAlert.ts`) instead of always reading green — a
          // fast-moving slick heading straight for the coast should look
          // urgent here, not identical to a stalled, harmless one. Falls
          // back to the path's own end-of-gradient colour only until the
          // coastline extract (and so severity) has loaded.
          color: coastalAlertSeverity ? ALERT_SEVERITY_CSS[coastalAlertSeverity] : forecastColorCssAt(1),
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
    coastalAlertSeverity,
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
    setEvidenceOpen(true);
  }, []);


  // --- Evidence dossier / docked map ----------------------------------
  const evidenceDocked = evidenceOpen && selectedSpill != null;

  // PDF evidence report, prepared in stages as the analyst's intent firms up
  // (see useReportPreparation.ts) so a click is usually an instant download
  // and never blocks the map.
  const reportInput = useMemo(
    () => (selectedSpill ? { spill: selectedSpill, spills, trajectory, environment, attribution, forecast, coastline } : null),
    [selectedSpill, spills, trajectory, environment, attribution, forecast, coastline]
  );
  const report = useReportPreparation({
    input: reportInput,
    engaged: backtrackActive || evidenceOpen,
    evidenceOpen: evidenceDocked,
    mapBusy: timeline.isPlaying || (vesselReveal.stage !== 'idle' && vesselReveal.stage !== 'done'),
  });

  useEffect(() => {
    if (!selectedSpillId) setEvidenceOpen(false);
  }, [selectedSpillId]);

  useEffect(() => {
    if (!evidenceDocked && !insetExpanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (evidenceDocked) setEvidenceOpen(false);
      else setInsetExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [evidenceDocked, insetExpanded]);

  // Keeps the map canvas matched to its container (e.g. when the app's left
  // sidebar collapses — MapLibre only tracks window resizes on its own), and
  // records the stage's untransformed size for the dossier fold below.
  const [stageSize, setStageSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    let frame: number | null = null;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setStageSize({ w: rect.width, h: rect.height });
      if (frame != null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        mapRef.current?.resize();
      });
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, []);

  // Fold geometry: uniform scale that fits the stage's width to the
  // dossier's mini-map slot, plus the clip that crops it to the slot's height
  // (values in the stage's own, pre-scale pixels). Mirrors --mini-* in
  // maritime-map.css; the slot spans the full width on narrow screens.
  const dockStyle = useMemo(() => {
    if (!stageSize || stageSize.w <= 0) return undefined;
    const miniW = window.innerWidth < 1024 ? stageSize.w - 48 : 300;
    const miniH = 290;
    const scale = miniW / stageSize.w;
    return {
      '--dock-scale': String(scale),
      '--dock-clip-bottom': `${Math.max(0, stageSize.h - miniH / scale)}px`,
      '--dock-radius': `${12 / scale}px`,
    } as React.CSSProperties;
  }, [stageSize]);

  return (
    <div className="maritime-map-shell">
      {/*
        The map "stage". Opening the evidence dossier folds it into the
        dossier's mini-map slot and fades it out (see .maritime-map-stage in
        maritime-map.css); it stays mounted, so closing the dossier restores
        it exactly as it was.
      */}
      <div
        className={`maritime-map-stage ${evidenceDocked ? 'is-docked' : ''}`}
        style={dockStyle}
      >
        <div ref={wrapperRef} className="maritime-map-wrapper relative min-w-0 flex-1 h-full">
          {/*
            Bottom-left now only carries legends — every control moved into
            MapTopBar. `flex-col-reverse` stacks bottom-up from actual
            rendered content, so legends never overlap or rely on guessed
            `bottom-N` offsets.
          */}
          <div className="maritime-stage-chrome absolute bottom-4 left-4 z-10 flex flex-col-reverse items-start gap-1.5">
            {oceanFlow.visible && oceanFlow.status === 'ready' && <OceanFlowLegend />}

            {/* Only meaningful once a forecast is actually on screen — the
                predicted-position marker it explains doesn't exist otherwise. */}
            {selectedSpill && investigationMode === 'forecast' && forecast && <AlertSeverityLegend />}
          </div>

          {selectedSpill && backtrackActive && vesselReveal.stage !== 'idle' && (
            <button
              type="button"
              onClick={vesselReveal.start}
              className="maritime-stage-chrome absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-card-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-accent"
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

          <RegionInsetMap
            spills={spills}
            selectedSpill={selectedSpill}
            trajectory={trajectory}
            basemapMode={basemapMode}
            theme={theme}
            onSelectSpill={selectSpill}
            expanded={insetExpanded}
            onExpandedChange={setInsetExpanded}
          />

          {/*
            Top toolbar — always present: map controls (basemap, globe,
            reload, wind/current) plus, once a spill is selected, the
            investigation modules (each drops a card down on the right) and
            the evidence dossier. Floats over the map at full width.
          */}
          <MapTopBar
            basemapMode={basemapMode}
            onSelectBasemap={setBasemapMode}
            spillCount={spills.length}
            isSpillsLoading={isSpillsLoading}
            spillsError={spillsError}
            onReloadSpills={reload}
            onResetView={handleResetView}
            hasSelection={selectedSpill != null}
            activeModule={activeModule}
            onSelectModule={setActiveModule}
            onClearInvestigation={handleClearInvestigation}
            highlighted={{ vessels: isRevealing && rank1Vessel != null }}
            onOccupiedWidthChange={setRightInset}
            evidenceOpen={evidenceDocked}
            onOpenEvidence={handleScrollToDetails}
            onDownloadReport={report.download}
            onReportIntent={report.noteIntent}
            reportBusy={report.status === 'generating'}
            reportReady={report.status === 'ready'}
            reportStepLabel={report.stepLabel}
            renderModule={(module) => {
              if (!selectedSpill) return null;
              switch (module) {
                case 'investigation':
                  return (
                    <InvestigationPanel
                      spill={selectedSpill}
                      focusMode={focusMode}
                      trajectory={trajectory}
                      isTrajectoryLoading={isTrajectoryLoading}
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
                      onRecenter={handleRecenter}
                      onScrollToDetails={handleScrollToDetails}
                    />
                  );
                case 'incident':
                  return <IncidentModule spill={selectedSpill} trajectory={trajectory} />;
                case 'image':
                  return <ImageModule spill={selectedSpill} />;
                case 'vessels':
                  return (
                    <VesselsModule
                      spill={selectedSpill}
                      attribution={attribution}
                      isLoading={isAttributionLoading}
                      trajectory={trajectory}
                    />
                  );
                case 'time':
                  return (
                    <TimeModule
                      spill={selectedSpill}
                      trajectory={trajectory}
                      environment={environment}
                      isLoading={isTrajectoryLoading}
                      error={trajectoryError}
                      currentTimeMs={backtrackActive ? timeline.currentTimeMs : null}
                    />
                  );
              }
            }}
          />
        </div>

        {/*
          Timeline overlay — floats on top of the map at the bottom edge
          so the map keeps its full height. pointer-events-none on the
          wrapper lets map clicks through; pointer-events-auto on the card
          keeps the controls interactive.
        */}
        {selectedSpill && backtrackActive && trajectory && (
          <div
            className="maritime-stage-chrome absolute bottom-4 z-20 flex items-end justify-center pointer-events-none"
            // Stops short of an open top-bar module card on the right,
            // so the timeline never slides underneath them.
            style={{ left: 16, right: rightInset + 16 }}
          >
            <div className="pointer-events-auto w-full max-w-[720px] rounded-xl border border-border bg-card shadow-xl">
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
                currentTimeLabel={
                  timeline.currentTimeMs != null ? formatUtcTimestamp(timeline.currentTimeMs) : null
                }
                startTimeLabel={timelineEnds?.left ?? null}
                endTimeLabel={timelineEnds?.right ?? null}
                marks={timelineMarks}
              />
            </div>
          </div>
        )}
      </div>

      {/* Report confirmation — polite, transient, never in the way. */}
      <div className="maritime-report-toast-slot" aria-live="polite">
        {report.notice && (
          <div
            key={report.notice.text}
            className={`maritime-report-toast ${report.notice.tone === 'warn' ? 'is-warn' : ''}`}
            role="status"
          >
            {report.notice.text}
          </div>
        )}
      </div>

      {selectedSpill && (
        <EvidenceDashboard
          open={evidenceDocked}
          onClose={() => setEvidenceOpen(false)}
          spill={selectedSpill}
          spills={spills}
          trajectory={trajectory}
          isTrajectoryLoading={isTrajectoryLoading}
          environment={environment}
          attribution={attribution}
          isAttributionLoading={isAttributionLoading}
          forecast={forecast}
          isForecastLoading={isForecastLoading}
          forecastError={forecastError}
          coastline={coastline}
          onDownloadReport={report.download}
          onReportIntent={report.noteIntent}
          reportBusy={report.status === 'generating'}
          reportReady={report.status === 'ready'}
          reportStepLabel={report.stepLabel}
        />
      )}
    </div>
  );
}
