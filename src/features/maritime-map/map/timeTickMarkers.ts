// src/features/maritime-map/map/timeTickMarkers.ts
//
// Eye-catching time-tick badges ("T-12h", "PROBABLE SOURCE", "DETECTION",
// "NOW", "PREDICTED POSITION") rendered as `maplibregl.Marker` HTML elements,
// not a deck.gl `TextLayer` (see `timeTickLabels.ts` for why) and not the
// plain halo-text symbol layer `timeTickLabels.ts` used before this pass.
//
// `Marker` positions its element via the map's own `project()`, the same
// projection MapLibre's native symbol-layer text already uses successfully
// under `GlobeViewport` — so, unlike deck.gl `TextLayer`, it tracks the globe
// correctly. Going through real DOM/CSS also unlocks what a symbol layer's
// paint spec cannot: a dark pill badge with a per-point accent colour lifted
// straight from the path's own gradient (`driftColorCssAt`/`forecastColorCssAt`),
// so a badge's colour always agrees with the path under it at a glance.

import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';

export interface TimeTickMarkerDatum {
  longitude: number;
  latitude: number;
  /** Short bold line, e.g. "T-12h" or "DETECTION". */
  title: string;
  /** Optional smaller second line, e.g. a formatted timestamp. */
  subtitle?: string;
  /** CSS colour string sampled from the path's own gradient at this point. */
  color: string;
  /** Endpoints render larger/bolder than the in-between hour ticks. */
  variant: 'endpoint' | 'tick';
}

const markersByPrefix = new Map<string, maplibregl.Marker[]>();

/**
 * Laid out sideways — anchor dot, then a short horizontal stem, then the
 * badge — and anchored to the marker's *left* edge (`updateTimeTickMarkers`)
 * so the dot sits exactly on the point and the badge reads off to the side
 * of it. A badge centred *above* the point (the previous layout) gets cut
 * through by the path's own continuation above that point; offsetting
 * sideways clears the line instead of sitting on top of it.
 */
function buildElement(datum: TimeTickMarkerDatum, prefix: string): HTMLDivElement {
  const root = document.createElement('div');
  root.className = `maritime-time-marker maritime-time-marker--${datum.variant}`;
  root.style.setProperty('--marker-color', datum.color);
  // Lets `clearStaleMarkerElements` find and strip every badge for this
  // prefix straight from the DOM, not just the ones this module instance
  // still has references to — see that function for why that distinction
  // matters.
  root.dataset.tickPrefix = prefix;

  const anchorDot = document.createElement('span');
  anchorDot.className = 'maritime-time-marker__anchor-dot';
  root.appendChild(anchorDot);

  const stem = document.createElement('span');
  stem.className = 'maritime-time-marker__stem';
  root.appendChild(stem);

  const badge = document.createElement('div');
  badge.className = 'maritime-time-marker__badge';

  const title = document.createElement('span');
  title.className = 'maritime-time-marker__title';
  title.textContent = datum.title;
  badge.appendChild(title);

  if (datum.subtitle) {
    const subtitle = document.createElement('span');
    subtitle.className = 'maritime-time-marker__subtitle';
    subtitle.textContent = datum.subtitle;
    badge.appendChild(subtitle);
  }

  root.appendChild(badge);

  return root;
}

/**
 * Belt-and-braces removal straight from the DOM, in addition to `.remove()`
 * on whatever this module instance has tracked in `markersByPrefix`.
 *
 * `markersByPrefix` is module-scope state. Vite's dev-time hot reload swaps
 * in a fresh module instance (and a fresh, empty `markersByPrefix`) whenever
 * this file — or `MaritimeMap.tsx`'s import of it — changes, but the marker
 * `<div>`s a *previous* instance already appended to the map are real DOM
 * nodes with no idea a new instance exists; nothing left holding their
 * `Marker` reference will ever call `.remove()` on them again. That orphans
 * a full stale badge set on the map — wrong position (an earlier layout),
 * duplicated against the current one — every time the map's still open
 * across an edit. Querying by the `data-tick-prefix` attribute finds and
 * strips those orphans regardless of which module instance created them.
 */
function clearStaleMarkerElements(map: MapLibreMap, prefix: string) {
  const container = map.getContainer();
  container.querySelectorAll<HTMLElement>(`.maritime-time-marker[data-tick-prefix="${prefix}"]`).forEach((el) => {
    el.closest('.maplibregl-marker')?.remove();
  });
}

/**
 * Replace the full marker set for `prefix` in one go. Rebuilding from scratch
 * rather than diffing is deliberate: there are at most a handful of ticks per
 * mode, so the cost is negligible, and it keeps this in lockstep with
 * `timeTickLabels.ts`'s old "push a whole new feature collection" pattern
 * without needing to key/diff individual DOM markers.
 */
export function updateTimeTickMarkers(map: MapLibreMap, prefix: string, points: TimeTickMarkerDatum[]) {
  const existing = markersByPrefix.get(prefix) ?? [];
  existing.forEach((marker) => marker.remove());
  clearStaleMarkerElements(map, prefix);

  const markers = points.map((datum) => {
    const element = buildElement(datum, prefix);
    // Anchored to the element's left edge, nudged left by half the anchor
    // dot's own width so the dot's centre — not the element's edge — lands
    // exactly on the point.
    const dotRadius = datum.variant === 'endpoint' ? 5 : 4;
    return new maplibregl.Marker({ element, anchor: 'left', offset: [-dotRadius, 0] })
      .setLngLat([datum.longitude, datum.latitude])
      .addTo(map);
  });

  markersByPrefix.set(prefix, markers);
}

export function removeTimeTickMarkers(prefix: string, map?: MapLibreMap) {
  const existing = markersByPrefix.get(prefix) ?? [];
  existing.forEach((marker) => marker.remove());
  markersByPrefix.delete(prefix);
  if (map) clearStaleMarkerElements(map, prefix);
}

// Extra safety net: if this exact module instance is about to be replaced by
// a hot update, take its own markers off the map first instead of leaving
// them for `clearStaleMarkerElements` to find on the next update (which only
// runs for 'drift' updates the app itself triggers, not on every edit).
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    markersByPrefix.forEach((markers) => markers.forEach((marker) => marker.remove()));
    markersByPrefix.clear();
  });
}
