// src/features/maritime-map/map/vesselRevealMarker.ts
//
// Compact info card for the "who did this" vessel reveal: who it is and the
// three numbers that matter at the spill moment (speed, distance to origin,
// timing vs release), plus the drift-radius verdict. Full identity and the
// timing breakdown live in the Vessel details module and the evidence
// dossier — this card only labels the ship, so it stays small enough not to
// cover the path, origin and slick around it.
//
// Layout: an anchor dot on the vessel, a short leader clearing the ship
// model, then the card. Below `CARD_MIN_ZOOM` the card and leader tuck away
// and only the dot remains — at wide zoom the card would dwarf the scene it
// describes (the ship itself shrinks with zoom, see VesselInvestigationLayer).

import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { refreshTimeTickDeclutter } from './timeTickMarkers';

export interface VesselRevealMarkerDatum {
  longitude: number;
  latitude: number;
  rank: number;
  vesselId: string;
  vesselName: string;
  mmsi: string | null;
  imo: string | null;
  vesselType: string | null;
  country: string | null;
  identifiersSynthetic: boolean;
  /** Speed in knots at the backtrack-origin (spill-release) timestamp — `culpritLocation.speed`, not a live reading. */
  speedKnots: number | null;
  /** Course over ground at that same moment, degrees. */
  courseDeg: number | null;
  distanceKm: number | null;
  /** Spill release time — backend estimate, else the backtrack's oldest sample. */
  releaseTimeMs: number | null;
  /** Backend `time_difference_hours`: vessel pass time minus release time (negative = before release). */
  timeOffsetHours: number | null;
  /** null when the backend didn't report `verification.within_backtrack_radius`. */
  withinRadius: boolean | null;
  driftRadiusKm: number | null;
}

/** Below this zoom only the anchor dot shows. */
const CARD_MIN_ZOOM = 10.5;

let marker: maplibregl.Marker | null = null;
let zoomHandler: (() => void) | null = null;
let boundMap: MapLibreMap | null = null;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function stat(label: string, value: string): HTMLDivElement {
  const s = el('div', 'vrm-stat');
  s.appendChild(el('span', 'vrm-stat__value', value));
  s.appendChild(el('span', 'vrm-stat__label', label));
  return s;
}

function formatOffset(hours: number): string {
  const abs = Math.abs(hours);
  if (abs < 1 / 60) return 'at release';
  const magnitude = abs < 1 ? `${Math.round(abs * 60)}m` : `${abs.toFixed(1)}h`;
  return `${magnitude} ${hours < 0 ? 'before' : 'after'}`;
}

function buildElement(d: VesselRevealMarkerDatum): HTMLDivElement {
  const root = el('div', 'maritime-vessel-reveal-marker');
  root.dataset.vesselReveal = 'true';
  root.appendChild(el('span', 'maritime-vessel-reveal-marker__dot'));
  root.appendChild(el('span', 'maritime-vessel-reveal-marker__stem'));

  const card = el('div', 'maritime-vessel-reveal-marker__card');

  const header = el('div', 'vrm-header');
  const titleBlock = el('div', 'vrm-header__title');
  titleBlock.appendChild(el('span', 'vrm-name', d.vesselName));
  const sub = [d.vesselType, d.country].filter(Boolean).join(' · ');
  const subLine = el('span', 'vrm-sub', sub || '—');
  if (d.identifiersSynthetic) {
    const tag = el('span', 'vrm-tag', 'SYN');
    tag.title = 'Synthetic identifiers — MMSI, IMO and name are generated placeholders.';
    subLine.appendChild(tag);
  }
  titleBlock.appendChild(subLine);
  header.appendChild(titleBlock);
  header.appendChild(el('span', 'vrm-rank', `#${d.rank}`));
  card.appendChild(header);

  const stats = el('div', 'vrm-stats');
  stats.appendChild(stat('speed', d.speedKnots != null ? `${d.speedKnots.toFixed(1)} kn` : '—'));
  stats.appendChild(stat('to origin', d.distanceKm != null ? `${d.distanceKm.toFixed(1)} km` : '—'));
  stats.appendChild(stat('release', d.timeOffsetHours != null ? formatOffset(d.timeOffsetHours) : '—'));
  card.appendChild(stats);

  if (d.withinRadius != null) {
    const flag = el('div', `vrm-flag vrm-flag--${d.withinRadius ? 'ok' : 'warn'}`);
    flag.appendChild(el('span', 'vrm-flag__dot'));
    flag.appendChild(document.createTextNode(d.withinRadius ? 'Within drift radius' : 'Outside drift radius'));
    if (d.driftRadiusKm != null) flag.title = `Drift uncertainty radius ± ${d.driftRadiusKm.toFixed(1)} km`;
    card.appendChild(flag);
  }

  root.appendChild(card);
  return root;
}

function applyZoomClass(map: MapLibreMap) {
  const element = marker?.getElement().querySelector<HTMLElement>('.maritime-vessel-reveal-marker');
  element?.classList.toggle('is-far', map.getZoom() < CARD_MIN_ZOOM);
}

function unbindZoom() {
  if (boundMap && zoomHandler) boundMap.off('zoom', zoomHandler);
  boundMap = null;
  zoomHandler = null;
}

/** Add/replace the single vessel-reveal marker. Rebuilds from scratch each call — see `timeTickMarkers.ts` for why that's fine at this scale. */
export function updateVesselRevealMarker(map: MapLibreMap, datum: VesselRevealMarkerDatum): void {
  removeStaleMarkerElements(map);
  marker?.remove();
  unbindZoom();

  const element = buildElement(datum);
  // Anchored on the dot's centre (4px = half its width) so the leader starts exactly at the vessel.
  marker = new maplibregl.Marker({ element, anchor: 'top-left', offset: [-4, -4] })
    .setLngLat([datum.longitude, datum.latitude])
    .addTo(map);

  zoomHandler = () => applyZoomClass(map);
  boundMap = map;
  map.on('zoom', zoomHandler);
  applyZoomClass(map);

  // Time-tick badges step aside for the card rather than sit underneath it.
  refreshTimeTickDeclutter(map);
}

export function removeVesselRevealMarker(map?: MapLibreMap): void {
  marker?.remove();
  marker = null;
  unbindZoom();
  if (map) {
    removeStaleMarkerElements(map);
    refreshTimeTickDeclutter(map);
  }
}

/** Same HMR-orphan defense as `timeTickMarkers.ts` — strips any marker DOM a previous hot-reloaded module instance left behind. */
function removeStaleMarkerElements(map: MapLibreMap): void {
  map
    .getContainer()
    .querySelectorAll<HTMLElement>('.maritime-vessel-reveal-marker[data-vessel-reveal="true"]')
    .forEach((node) => {
      node.closest('.maplibregl-marker')?.remove();
    });
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    marker?.remove();
    marker = null;
    unbindZoom();
  });
}
