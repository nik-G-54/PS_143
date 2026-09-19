import type { FitBoundsOptions, Map as MapLibreMap } from 'maplibre-gl';
import type { GeoBounds, MapSpill } from '../types/spillTypes';
import { MAP_CONFIG } from './mapConfig';

/**
 * Camera choreography for the maritime map.
 *
 * The map opens on the globe, then flies to the detection region once spills load.
 * That reveal is not decoration — every detection in the demo archive sits inside
 * a box roughly 8 km across, which is far below one pixel at the globe's zoom, so
 * without it the 97 points are a single dot.
 */

/** Zoom ceiling for the reveal — close enough to separate the dots, wide enough to keep them all in frame. */
const REVEAL_MAX_ZOOM = 12.5;
const REVEAL_DURATION_MS = 2600;

/** Zoom used when a single spill is opened for investigation. */
const SPILL_ZOOM = 13.5;
const SPILL_FLY_DURATION_MS = 1900;

/** Zoom ceiling when framing a drift path, so a short path does not fill the screen. */
const DRIFT_MAX_ZOOM = 13.5;
const DRIFT_DURATION_MS = 1500;

/** Leaves room for the investigation panel on the right and the legend at the lower left. */
const DRIFT_PADDING: FitBoundsOptions['padding'] = {
  top: 76,
  bottom: 96,
  left: 76,
  right: 300,
};

const GLOBE_DURATION_MS = 2200;

/** Below this span in degrees a bounding box is effectively a point and `fitBounds` would over-zoom. */
const DEGENERATE_BOUNDS_SPAN = 1e-4;

/**
 * Caps each padding side to a safe fraction of the map container's own
 * current size. `fitBounds` padding carves out screen space the bounds must
 * fit *inside*; the padding constants below (`DRIFT_PADDING`,
 * `VESSEL_FRAME_PADDING`) are tuned for a full desktop window. On a
 * narrower/shorter container that padding can exceed the container itself,
 * leaving `fitBounds` almost no real space to solve for — instead of
 * failing loudly it silently returns a wildly wrong zoom/center (confirmed
 * directly: on a 450×210px container, `right: 320` alone eats 71% of the
 * width, and the resulting camera lands nowhere near the requested bounds).
 * Capping at 35% per side always leaves at least 30% of the container as
 * real usable space, with no effect at all on a normal-sized window where
 * these fixed paddings were already well under that.
 */
function clampPaddingToContainer(
  map: MapLibreMap,
  padding: FitBoundsOptions['padding']
): FitBoundsOptions['padding'] {
  const container = map.getContainer();
  const maxHorizontal = (container.clientWidth || 1) * 0.35;
  const maxVertical = (container.clientHeight || 1) * 0.35;

  if (padding == null) return padding;
  if (typeof padding === 'number') {
    return Math.min(padding, maxHorizontal, maxVertical);
  }
  return {
    top: Math.min(padding.top ?? 0, maxVertical),
    bottom: Math.min(padding.bottom ?? 0, maxVertical),
    left: Math.min(padding.left ?? 0, maxHorizontal),
    right: Math.min(padding.right ?? 0, maxHorizontal),
  };
}

/** `fitBounds` with a centred fallback for boxes too small for it to solve sanely. */
function fitGeoBounds(
  map: MapLibreMap,
  bounds: GeoBounds,
  options: { padding: FitBoundsOptions['padding']; maxZoom: number; duration: number }
): void {
  const lonSpan = bounds.maxLon - bounds.minLon;
  const latSpan = bounds.maxLat - bounds.minLat;

  if (lonSpan < DEGENERATE_BOUNDS_SPAN && latSpan < DEGENERATE_BOUNDS_SPAN) {
    map.flyTo({
      center: [bounds.minLon, bounds.minLat],
      zoom: options.maxZoom,
      duration: options.duration,
      essential: true,
    });
    return;
  }

  map.fitBounds(
    [
      [bounds.minLon, bounds.minLat],
      [bounds.maxLon, bounds.maxLat],
    ],
    {
      padding: clampPaddingToContainer(map, options.padding),
      maxZoom: options.maxZoom,
      duration: options.duration,
      essential: true,
    }
  );
}

/** Frame every detection. Falls back to a centred flyTo when the spills are co-located. */
export function revealSpillRegion(map: MapLibreMap, bounds: GeoBounds): void {
  fitGeoBounds(map, bounds, {
    padding: 110,
    maxZoom: REVEAL_MAX_ZOOM,
    duration: REVEAL_DURATION_MS,
  });
}

/** Move in on one spill without losing the surrounding detections from view. */
export function flyToSpill(map: MapLibreMap, spill: MapSpill): void {
  map.flyTo({
    center: [spill.longitude, spill.latitude],
    // Never pull back if the investigator has already zoomed in past our target.
    zoom: Math.max(map.getZoom(), SPILL_ZOOM),
    duration: SPILL_FLY_DURATION_MS,
    curve: 1.3,
    essential: true,
  });
}

/**
 * Frame a spill's whole drift path, origin included.
 *
 * This is the second beat of the two-stage reveal: `flyToSpill` answers the click
 * immediately at a fixed zoom, then this widens out once the trajectory arrives to
 * show where the oil came from. A fixed zoom cannot serve both — paths in the
 * archive run from 5.6 km to 47.9 km end to end, a ninefold spread.
 *
 * Unlike `flyToSpill` this will zoom out, which is the point: the drift is the
 * subject now. Callers fire it once per selection so it never fights a manual zoom.
 */
export function frameDriftPath(map: MapLibreMap, bounds: GeoBounds): void {
  fitGeoBounds(map, bounds, {
    padding: DRIFT_PADDING,
    maxZoom: DRIFT_MAX_ZOOM,
    duration: DRIFT_DURATION_MS,
  });
}

// --- Vessel-reveal choreography ---------------------------------------
//
// Four camera beats for the post-timeline "who did this" sequence (see
// `useVesselRevealStage.ts` for the stage machine and `MaritimeMap.tsx` for
// the effect that fires these in order): wide two-point frame, in on the
// ship as it appears, settle back to show the connecting line, then a tight
// close-up. Every beat is a real camera move — none of the stage transitions
// are appearance-only — per the brief that every new beat should have its
// own "zoom out / zoom in" movement, not just the first and last.

const VESSEL_FRAME_PADDING: FitBoundsOptions['padding'] = { top: 90, bottom: 110, left: 90, right: 320 };
const VESSEL_FRAME_MAX_ZOOM = 12;
const VESSEL_FRAME_DURATION_MS = 1700;

const VESSEL_SHIP_ZOOM = 13.5;
const VESSEL_SHIP_DURATION_MS = 1400;

const VESSEL_SETTLE_MAX_ZOOM = 12.3;
const VESSEL_SETTLE_DURATION_MS = 1500;

const VESSEL_CLOSEUP_ZOOM = 15;
const VESSEL_CLOSEUP_DURATION_MS = 1600;

/** Beat A / C: wide shot framing both the origin marker and the vessel together. */
export function frameOriginAndVessel(
  map: MapLibreMap,
  origin: [number, number],
  vessel: [number, number],
  variant: 'wide' | 'settle' = 'wide'
): void {
  const bounds: GeoBounds = {
    minLon: Math.min(origin[0], vessel[0]),
    maxLon: Math.max(origin[0], vessel[0]),
    minLat: Math.min(origin[1], vessel[1]),
    maxLat: Math.max(origin[1], vessel[1]),
  };
  fitGeoBounds(map, bounds, {
    padding: VESSEL_FRAME_PADDING,
    maxZoom: variant === 'wide' ? VESSEL_FRAME_MAX_ZOOM : VESSEL_SETTLE_MAX_ZOOM,
    duration: variant === 'wide' ? VESSEL_FRAME_DURATION_MS : VESSEL_SETTLE_DURATION_MS,
  });
}

/** Beat B: move in toward the vessel as its ship model pops in. */
export function flyToVessel(map: MapLibreMap, vessel: [number, number]): void {
  map.flyTo({
    center: vessel,
    zoom: Math.max(map.getZoom(), VESSEL_SHIP_ZOOM),
    duration: VESSEL_SHIP_DURATION_MS,
    curve: 1.2,
    essential: true,
  });
}

/** Beat D: final tight close-up on the ship. */
export function closeUpOnVessel(map: MapLibreMap, vessel: [number, number]): void {
  map.flyTo({
    center: vessel,
    zoom: VESSEL_CLOSEUP_ZOOM,
    duration: VESSEL_CLOSEUP_DURATION_MS,
    curve: 1.4,
    essential: true,
  });
}

export const VESSEL_REVEAL_DURATIONS_MS = {
  framing: VESSEL_FRAME_DURATION_MS,
  ship: VESSEL_SHIP_DURATION_MS,
  distance: VESSEL_SETTLE_DURATION_MS,
  closeup: VESSEL_CLOSEUP_DURATION_MS,
} as const;

/** Return to the opening globe view. */
export function resetToGlobe(map: MapLibreMap): void {
  const { longitude, latitude, zoom, pitch, bearing } = MAP_CONFIG.initialCamera;
  map.flyTo({
    center: [longitude, latitude],
    zoom,
    pitch,
    bearing,
    duration: GLOBE_DURATION_MS,
    essential: true,
  });
}
