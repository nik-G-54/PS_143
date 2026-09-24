// src/features/maritime-map/map/vesselRevealMarker.ts
//
// The info card for the "who did this" vessel-reveal sequence: identity,
// kinematics at the spill moment, and a timing comparison between the spill
// release and the vessel's pass over the origin. A dedicated marker rather
// than reusing `timeTickMarkers.ts`'s pill badge — that one-line format has
// no room for a multi-section card.
//
// Layout: an anchor dot sits exactly on the vessel, a straight leader runs
// out past the ship model's footprint (~90px long, see
// `VesselInvestigationLayer.ts`'s SHIP_TARGET_SCREEN_LENGTH_PX), then the
// card. Flat, theme-token colours only — no gradients or glows — so it reads
// as an instrument readout in both light and dark mode.

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

let marker: maplibregl.Marker | null = null;

const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});
const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function row(label: string, value: string, strong = false): HTMLDivElement {
  const r = el('div', 'vrm-row');
  r.appendChild(el('span', 'vrm-row__label', label));
  r.appendChild(el('span', `vrm-row__value${strong ? ' vrm-row__value--strong' : ''}`, value));
  return r;
}

function formatOffset(hours: number): string {
  const abs = Math.abs(hours);
  if (abs < 1 / 60) return 'At release';
  const magnitude = abs < 1 ? `${Math.round(abs * 60)} min` : `${abs.toFixed(1)} h`;
  return `${magnitude} ${hours < 0 ? 'before' : 'after'}`;
}

/**
 * Two-point time axis: the spill release and the vessel's pass, placed to
 * scale inside a window padded around both, so "43 min before" is visible
 * as a gap rather than only read as text.
 */
function buildTimingAxis(offsetHours: number): HTMLDivElement {
  const axis = el('div', 'vrm-axis');
  const halfWindow = Math.max(Math.abs(offsetHours) * 1.4, 0.5);
  const pos = (h: number) => `${((h + halfWindow) / (2 * halfWindow)) * 100}%`;

  axis.appendChild(el('span', 'vrm-axis__line'));

  const span = el('span', 'vrm-axis__span');
  const a = Math.min(0, offsetHours);
  const b = Math.max(0, offsetHours);
  span.style.left = pos(a);
  span.style.width = `${((b - a) / (2 * halfWindow)) * 100}%`;
  axis.appendChild(span);

  const release = el('span', 'vrm-axis__mark vrm-axis__mark--release');
  release.style.left = pos(0);
  release.title = 'Spill release';
  axis.appendChild(release);

  const vessel = el('span', 'vrm-axis__mark vrm-axis__mark--vessel');
  vessel.style.left = pos(offsetHours);
  vessel.title = 'Vessel at origin';
  axis.appendChild(vessel);

  const legend = el('div', 'vrm-axis__legend');
  const l1 = el('span', 'vrm-legend');
  l1.appendChild(el('span', 'vrm-legend__swatch vrm-legend__swatch--vessel'));
  l1.appendChild(document.createTextNode('Vessel'));
  const l2 = el('span', 'vrm-legend');
  l2.appendChild(el('span', 'vrm-legend__swatch vrm-legend__swatch--release'));
  l2.appendChild(document.createTextNode('Release'));
  legend.appendChild(l1);
  legend.appendChild(l2);

  const wrap = el('div', 'vrm-axis-wrap');
  wrap.appendChild(axis);
  wrap.appendChild(legend);
  return wrap;
}

function buildElement(d: VesselRevealMarkerDatum): HTMLDivElement {
  const root = el('div', 'maritime-vessel-reveal-marker');
  root.dataset.vesselReveal = 'true';
  root.appendChild(el('span', 'maritime-vessel-reveal-marker__dot'));
  root.appendChild(el('span', 'maritime-vessel-reveal-marker__stem'));

  const card = el('div', 'maritime-vessel-reveal-marker__card');

  // Header
  const header = el('div', 'vrm-header');
  const titleBlock = el('div', 'vrm-header__title');
  titleBlock.appendChild(el('span', 'vrm-eyebrow', 'Prime candidate'));
  titleBlock.appendChild(el('span', 'vrm-name', d.vesselName));
  header.appendChild(titleBlock);
  header.appendChild(el('span', 'vrm-rank', `#${d.rank}`));
  card.appendChild(header);

  const sub = [d.vesselType, d.country].filter(Boolean).join(' · ');
  if (sub || d.identifiersSynthetic) {
    const subRow = el('div', 'vrm-sub');
    if (sub) subRow.appendChild(el('span', '', sub));
    if (d.identifiersSynthetic) {
      const tag = el('span', 'vrm-tag', 'Synthetic IDs');
      tag.title = 'MMSI, IMO and name are generated placeholders, not registry identifiers.';
      subRow.appendChild(tag);
    }
    card.appendChild(subRow);
  }

  // Identity
  const identity = el('div', 'vrm-section');
  identity.appendChild(row('Vessel ID', d.vesselId));
  identity.appendChild(row('MMSI', d.mmsi ?? '—'));
  if (d.imo) identity.appendChild(row('IMO', d.imo));
  card.appendChild(identity);

  // At spill time
  const motion = el('div', 'vrm-section');
  motion.appendChild(el('span', 'vrm-section__title', 'At spill time'));
  motion.appendChild(row('Speed', d.speedKnots != null ? `${d.speedKnots.toFixed(1)} kn` : '—', true));
  motion.appendChild(row('Course', d.courseDeg != null ? `${Math.round(d.courseDeg)}°` : '—'));
  motion.appendChild(row('Distance to origin', d.distanceKm != null ? `${d.distanceKm.toFixed(2)} km` : '—', true));
  card.appendChild(motion);

  // Timing comparison
  if (d.timeOffsetHours != null) {
    const timing = el('div', 'vrm-section');
    timing.appendChild(el('span', 'vrm-section__title', 'Timing vs spill'));
    timing.appendChild(buildTimingAxis(d.timeOffsetHours));
    if (d.releaseTimeMs != null && Number.isFinite(d.releaseTimeMs)) {
      const passMs = d.releaseTimeMs + d.timeOffsetHours * 3_600_000;
      timing.appendChild(row('Spill release', `${TIME_FORMAT.format(d.releaseTimeMs)} UTC`));
      timing.appendChild(row('Vessel at origin', `${TIME_FORMAT.format(passMs)} UTC`));
      timing.appendChild(el('span', 'vrm-date', DATE_FORMAT.format(d.releaseTimeMs)));
    }
    timing.appendChild(row('Offset', formatOffset(d.timeOffsetHours), true));
    card.appendChild(timing);
  }

  if (d.withinRadius != null) {
    const flag = el(
      'div',
      `vrm-flag vrm-flag--${d.withinRadius ? 'ok' : 'warn'}`,
      d.withinRadius ? 'Within drift radius' : 'Outside drift radius'
    );
    if (d.driftRadiusKm != null) flag.title = `Drift uncertainty radius ± ${d.driftRadiusKm.toFixed(1)} km`;
    card.appendChild(flag);
  }

  root.appendChild(card);
  return root;
}

/** Add/replace the single vessel-reveal marker. Rebuilds from scratch each call — see `timeTickMarkers.ts` for why that's fine at this scale. */
export function updateVesselRevealMarker(map: MapLibreMap, datum: VesselRevealMarkerDatum): void {
  removeStaleMarkerElements(map);
  marker?.remove();

  const element = buildElement(datum);
  // Anchored on the dot's centre (5px = half its width) so the leader starts
  // exactly at the vessel; the stem length (CSS) clears the ship model.
  marker = new maplibregl.Marker({ element, anchor: 'top-left', offset: [-5, -5] })
    .setLngLat([datum.longitude, datum.latitude])
    .addTo(map);
  // Time-tick badges step aside for the card rather than sit underneath it.
  refreshTimeTickDeclutter(map);
}

export function removeVesselRevealMarker(map?: MapLibreMap): void {
  marker?.remove();
  marker = null;
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
  });
}
