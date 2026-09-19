// src/features/maritime-map/map/vesselDistanceRuler.ts
//
// Ruler markings for the vessel-reveal's origin -> vessel distance line (the
// dashed PathLayer drawn by VesselInvestigationLayer.ts): a coloured dot at
// each endpoint (origin = orange, vessel = blue) plus a running "Nkm" label
// under every scale tick along the line, ending in the exact total distance
// at the vessel end — the same ruler notation used for candidate-vessel
// distance readouts elsewhere in the product.
//
// HTML `maplibregl.Marker`s, not a deck.gl TextLayer/ScatterplotLayer — same
// reason as timeTickMarkers.ts: text billboarding under this map's
// GlobeViewport doesn't track correctly, while Marker positions itself
// through the map's own project() the way MapLibre's native symbol layers do.

import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';

export interface DistanceRulerPoint {
  longitude: number;
  latitude: number;
}

export interface DistanceRulerDatum {
  origin: DistanceRulerPoint;
  vessel: DistanceRulerPoint;
  distanceKm: number;
}

const TICK_INTERVAL_KM = 2;
/** Below this, the last regular tick and the true total are visually the same value. */
const EPSILON_KM = 0.05;

let markers: maplibregl.Marker[] = [];

function lerp(origin: DistanceRulerPoint, vessel: DistanceRulerPoint, t: number): DistanceRulerPoint {
  return {
    longitude: origin.longitude + (vessel.longitude - origin.longitude) * t,
    latitude: origin.latitude + (vessel.latitude - origin.latitude) * t,
  };
}

function buildDot(role: 'origin' | 'vessel'): HTMLDivElement {
  const dot = document.createElement('div');
  dot.className = `maritime-distance-ruler__dot maritime-distance-ruler__dot--${role}`;
  dot.dataset.distanceRuler = 'true';
  return dot;
}

function buildTickLabel(text: string, strong: boolean): HTMLDivElement {
  const label = document.createElement('div');
  label.className = `maritime-distance-ruler__tick${strong ? ' maritime-distance-ruler__tick--strong' : ''}`;
  label.dataset.distanceRuler = 'true';

  const dash = document.createElement('span');
  dash.className = 'maritime-distance-ruler__tick-dash';
  label.appendChild(dash);

  const value = document.createElement('span');
  value.className = 'maritime-distance-ruler__tick-value';
  value.textContent = text;
  label.appendChild(value);

  return label;
}

function addMarker(map: MapLibreMap, element: HTMLElement, point: DistanceRulerPoint, offset: [number, number]): void {
  const marker = new maplibregl.Marker({ element, anchor: 'center', offset })
    .setLngLat([point.longitude, point.latitude])
    .addTo(map);
  markers.push(marker);
}

/** Add/replace the full ruler (endpoint dots + tick labels) for the current vessel-reveal distance line. */
export function updateDistanceRuler(map: MapLibreMap, datum: DistanceRulerDatum): void {
  removeDistanceRuler(map);

  addMarker(map, buildDot('origin'), datum.origin, [0, 0]);
  addMarker(map, buildDot('vessel'), datum.vessel, [0, 0]);

  if (!(datum.distanceKm > 0)) return;

  const steps = Math.floor(datum.distanceKm / TICK_INTERVAL_KM);
  for (let i = 1; i <= steps; i += 1) {
    const tickKm = i * TICK_INTERVAL_KM;
    // The last regular tick doubles as the total when the distance is
    // (near enough) an exact multiple of the interval, so it doesn't get an
    // orphaned duplicate label sitting on top of it.
    const isFinal = i === steps && datum.distanceKm - tickKm < EPSILON_KM;
    const t = tickKm / datum.distanceKm;
    const label = isFinal ? `${datum.distanceKm.toFixed(2)}km` : `${tickKm}km`;
    addMarker(map, buildTickLabel(label, isFinal), lerp(datum.origin, datum.vessel, t), [0, 16]);
  }

  const lastTickKm = steps * TICK_INTERVAL_KM;
  if (datum.distanceKm - lastTickKm >= EPSILON_KM) {
    addMarker(map, buildTickLabel(`${datum.distanceKm.toFixed(2)}km`, true), datum.vessel, [0, 16]);
  }
}

export function removeDistanceRuler(map?: MapLibreMap): void {
  markers.forEach((m) => m.remove());
  markers = [];
  if (map) removeStaleMarkerElements(map);
}

/** Same HMR-orphan defense as timeTickMarkers.ts — strips any marker DOM a previous hot-reloaded module instance left behind. */
function removeStaleMarkerElements(map: MapLibreMap): void {
  map
    .getContainer()
    .querySelectorAll<HTMLElement>('[data-distance-ruler="true"]')
    .forEach((el) => {
      el.closest('.maplibregl-marker')?.remove();
    });
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    markers.forEach((m) => m.remove());
    markers = [];
  });
}
