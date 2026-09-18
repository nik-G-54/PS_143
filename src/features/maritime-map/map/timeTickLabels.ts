// src/features/maritime-map/map/timeTickLabels.ts
//
// Time-tick label badges ("T-6h", "PROBABLE SOURCE", "NOW", etc.) rendered as
// a native MapLibre symbol layer, not a deck.gl `TextLayer`.
//
// Verified empirically against the installed @deck.gl/core 9.3.11: a
// `ScatterplotLayer` renders correctly at a given lon/lat under this map's
// `GlobeViewport` (confirmed at zoom ~10, still globe — MapLibre only
// transitions to Mercator at a much higher zoom than assumed), but a
// `TextLayer` with identical data, at the same position, with or without
// `billboard`, paints nothing. That is a deck.gl/globe limitation, not
// something fixable from this app's layer config. MapLibre's own symbol-layer
// text rendering is unaffected — it is MapLibre's native, long-established
// globe support, not deck.gl's — so labels live in the maplibre style
// instead, the same reason `DriftTrajectory.ts`'s Focus Mode polygon is a
// maplibre source/layer pair rather than a deck.gl `PolygonLayer`.
//
// One generic source/layer pair per `prefix` — callers key backtrack and
// forecast labels differently so arming one mode's labels never collides
// with the other's.

import type { Map, GeoJSONSource } from 'maplibre-gl';

export interface TimeTickLabelDatum {
  longitude: number;
  latitude: number;
  text: string;
}

const sourceId = (prefix: string) => `${prefix}-time-labels-source`;
const layerId = (prefix: string) => `${prefix}-time-labels-layer`;

function toFeatureCollection(points: TimeTickLabelDatum[]) {
  return {
    type: 'FeatureCollection' as const,
    features: points.map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
      properties: { text: p.text },
    })),
  };
}

/** Add the (initially empty) source/layer pair for one label set. Safe to call repeatedly — no-ops if already present. */
export function addTimeTickLabels(map: Map, prefix: string) {
  const src = sourceId(prefix);
  const lyr = layerId(prefix);

  if (!map.getSource(src)) {
    map.addSource(src, { type: 'geojson', data: toFeatureCollection([]) });
  }

  if (!map.getLayer(lyr)) {
    map.addLayer({
      id: lyr,
      type: 'symbol',
      source: src,
      layout: {
        'text-field': ['get', 'text'],
        'text-size': 11,
        // Must match a font-stack combination Carto's glyph CDN has actually
        // pre-generated (it serves combined ranges per exact stack, not
        // arbitrary combinations on demand) — an unlisted combination 404s
        // silently and the layer renders no glyphs at all. This is the exact
        // stack `cartoLabels.json`'s own bold text layers already use, so
        // it's guaranteed present.
        'text-font': [
          'Montserrat Medium',
          'Open Sans Bold',
          'Noto Sans Regular',
          'HanWangHeiLight Regular',
          'NanumBarunGothic Regular',
        ],
        'text-offset': [0, -1.4],
        'text-anchor': 'bottom',
        // Labels are sparse (a handful of ticks plus two endpoints) and
        // deliberately always shown — collision-based hiding would make a
        // label flicker in and out as the camera moves, which reads as
        // broken rather than as decluttering.
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#ffffff',
        // A halo rather than deck.gl TextLayer's solid rounded-rect
        // background (not available in MapLibre's symbol paint spec) —
        // this is the standard MapLibre/Mapbox technique for keeping label
        // text readable over arbitrary basemap imagery.
        'text-halo-color': '#0f1720',
        'text-halo-width': 2.5,
        'text-halo-blur': 0.5,
      },
    });
  }
}

/** Push a new label set into the existing source (no re-add). */
export function updateTimeTickLabels(map: Map, prefix: string, points: TimeTickLabelDatum[]) {
  const source = map.getSource(sourceId(prefix)) as GeoJSONSource | undefined;
  if (!source) return;
  source.setData(toFeatureCollection(points));
}

export function removeTimeTickLabels(map: Map, prefix: string) {
  const lyr = layerId(prefix);
  const src = sourceId(prefix);
  if (map.getLayer(lyr)) map.removeLayer(lyr);
  if (map.getSource(src)) map.removeSource(src);
}
