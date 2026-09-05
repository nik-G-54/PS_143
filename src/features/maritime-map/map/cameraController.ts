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
      padding: options.padding,
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
