// src/features/maritime-map/map/vesselRevealMarker.ts
//
// The info card for the "who did this" vessel-reveal sequence — name, MMSI,
// type, speed and distance/time-offset at the moment of the spill. A
// dedicated marker rather than reusing `timeTickMarkers.ts`'s pill badge:
// that component's one-line "T-4h"-style format has no room for five fields,
// and stretching it would regress the simpler badges it already handles well.
// Positioned beside the ship (`vesselReveal`'s culprit location), same
// sideways dot-stem-card layout as `timeTickMarkers.ts` so it reads as part
// of the same visual language without sharing its code.

import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';

export interface VesselRevealMarkerDatum {
  longitude: number;
  latitude: number;
  vesselName: string;
  mmsi: string | null;
  vesselType: string | null;
  /** Speed in knots at the backtrack-origin (spill-release) timestamp — `culpritLocation.speed`, not a live reading. */
  speedKnots: number | null;
  distanceKm: number | null;
  timeOffsetHours: number | null;
  /** null when the backend didn't report `verification.within_backtrack_radius`. */
  withinRadius: boolean | null;
}

let marker: maplibregl.Marker | null = null;

function buildElement(d: VesselRevealMarkerDatum): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'maritime-vessel-reveal-marker';
  root.dataset.vesselReveal = 'true';

  const dot = document.createElement('span');
  dot.className = 'maritime-vessel-reveal-marker__dot';
  root.appendChild(dot);

  const stem = document.createElement('span');
  stem.className = 'maritime-vessel-reveal-marker__stem';
  root.appendChild(stem);

  const card = document.createElement('div');
  card.className = 'maritime-vessel-reveal-marker__card';

  const header = document.createElement('div');
  header.className = 'maritime-vessel-reveal-marker__header';
  const name = document.createElement('span');
  name.className = 'maritime-vessel-reveal-marker__name';
  name.textContent = d.vesselName;
  header.appendChild(name);
  const rank = document.createElement('span');
  rank.className = 'maritime-vessel-reveal-marker__rank';
  rank.textContent = '#1';
  header.appendChild(rank);
  card.appendChild(header);

  const meta = document.createElement('div');
  meta.className = 'maritime-vessel-reveal-marker__row';
  const metaParts = [d.mmsi ? `MMSI ${d.mmsi}` : null, d.vesselType].filter(Boolean);
  meta.textContent = metaParts.length > 0 ? metaParts.join(' · ') : '—';
  card.appendChild(meta);

  if (d.speedKnots != null) {
    const speed = document.createElement('div');
    speed.className = 'maritime-vessel-reveal-marker__row';
    speed.textContent = `${d.speedKnots.toFixed(1)} kn at spill time`;
    card.appendChild(speed);
  }

  const distanceRow = document.createElement('div');
  distanceRow.className = 'maritime-vessel-reveal-marker__row maritime-vessel-reveal-marker__row--strong';
  const distanceParts: string[] = [];
  if (d.distanceKm != null) distanceParts.push(`${d.distanceKm.toFixed(1)} km from origin`);
  if (d.timeOffsetHours != null) {
    distanceParts.push(`${d.timeOffsetHours >= 0 ? '+' : ''}${d.timeOffsetHours.toFixed(1)}h`);
  }
  distanceRow.textContent = distanceParts.length > 0 ? distanceParts.join(' · ') : '—';
  card.appendChild(distanceRow);

  if (d.withinRadius != null) {
    const flag = document.createElement('div');
    flag.className = `maritime-vessel-reveal-marker__flag maritime-vessel-reveal-marker__flag--${
      d.withinRadius ? 'ok' : 'warn'
    }`;
    flag.textContent = d.withinRadius ? 'Within drift radius' : 'Outside drift radius';
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
  // The ship now holds a roughly constant ~90px screen length regardless of
  // zoom (see `VesselInvestigationLayer.ts`'s `shipSizeScaleForZoom`), so a
  // fixed offset clearing that footprint from its centre anchor stays valid
  // across zoom instead of overlapping a ship that used to shrink/grow with
  // real-world scale.
  marker = new maplibregl.Marker({ element, anchor: 'left', offset: [56, -8] })
    .setLngLat([datum.longitude, datum.latitude])
    .addTo(map);
}

export function removeVesselRevealMarker(map?: MapLibreMap): void {
  marker?.remove();
  marker = null;
  if (map) removeStaleMarkerElements(map);
}

/** Same HMR-orphan defense as `timeTickMarkers.ts` — strips any marker DOM a previous hot-reloaded module instance left behind. */
function removeStaleMarkerElements(map: MapLibreMap): void {
  map
    .getContainer()
    .querySelectorAll<HTMLElement>('.maritime-vessel-reveal-marker[data-vessel-reveal="true"]')
    .forEach((el) => {
      el.closest('.maplibregl-marker')?.remove();
    });
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    marker?.remove();
    marker = null;
  });
}
