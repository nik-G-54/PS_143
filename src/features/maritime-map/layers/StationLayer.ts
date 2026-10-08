// Coast guard stations, the dashed link from the selected spill to its nearest
// station, and a small badge on spills that have already been alerted.
//
// Icons use fixed colours on their own dark disc rather than a theme token, so
// they read the same on the light and dark basemaps.

import { IconLayer, PathLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import type { Layer } from '@deck.gl/core';
import * as turf from '@turf/turf';
import type { CoastGuardStation, NearestStation } from '../types/alertTypes';
import type { MapSpill } from '../types/spillTypes';
import { LAYER_IDS } from './layerIds';

export interface StationLayerOptions {
  stations: CoastGuardStation[];
  /** Nearest station to the selected spill, or null when nothing is selected. */
  nearest: NearestStation | null;
  selectedSpill: MapSpill | null;
  /** Spills with a successful alert in the log. */
  alertedSpills: MapSpill[];
}

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const anchorGlyph = (stroke: string) =>
  `<g fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">` +
  `<circle cx="32" cy="17" r="5"/><path d="M32 22V50M22 31H42M14 40C16 48 24 52 32 52C40 52 48 48 50 40"/></g>`;

const stationSvg = (ring: string, glyph: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
  `<circle cx="32" cy="32" r="29" fill="#0f172a" fill-opacity="0.88" stroke="${ring}" stroke-width="3"/>` +
  `${anchorGlyph(glyph)}</svg>`;

const STATION_ICON = { url: svgUrl(stationSvg('#94a3b8', '#e2e8f0')), width: 64, height: 64 };
const NEAREST_ICON = { url: svgUrl(stationSvg('#f59e0b', '#fde68a')), width: 64, height: 64 };

const ALERTED_ICON = {
  url: svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
      `<circle cx="16" cy="16" r="14" fill="#15803d" stroke="#ffffff" stroke-width="2.5"/>` +
      `<path d="M9.5 16.5L14 21L22.5 11.5" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  ),
  width: 32,
  height: 32,
};

const LINK_RGBA: [number, number, number, number] = [245, 158, 11, 230];

/**
 * Great-circle path between the spill and the station so the line follows the
 * globe instead of cutting a chord through it. Falls back to a straight
 * two-point path if turf can't produce one; a path split at the antimeridian
 * contributes each part separately.
 */
function linkPaths(from: [number, number], to: [number, number]): [number, number][][] {
  try {
    const { geometry } = turf.greatCircle(from, to, { npoints: 64 });
    if (geometry.type === 'LineString') return [geometry.coordinates as [number, number][]];
    return geometry.coordinates as [number, number][][];
  } catch {
    return [[from, to]];
  }
}

export function createStationLayers(options: StationLayerOptions): Layer[] {
  const { stations, nearest, selectedSpill, alertedSpills } = options;
  const layers: Layer[] = [];

  if (selectedSpill && nearest) {
    const paths = linkPaths(
      [selectedSpill.longitude, selectedSpill.latitude],
      [nearest.station.lon, nearest.station.lat]
    );
    layers.push(
      new PathLayer<[number, number][], { getDashArray: number[]; dashJustified: boolean }>({
        id: LAYER_IDS.stationLink,
        data: paths,
        getPath: (d) => d,
        getColor: LINK_RGBA,
        getWidth: 1.75,
        widthUnits: 'pixels',
        widthMinPixels: 1.5,
        getDashArray: [5, 3],
        dashJustified: true,
        extensions: [new PathStyleExtension({ dash: true })],
        pickable: false,
      })
    );
  }

  if (stations.length > 0) {
    const nearestId = nearest?.station.id ?? null;
    layers.push(
      new IconLayer<CoastGuardStation>({
        id: LAYER_IDS.stationIcons,
        data: stations,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => (d.id === nearestId ? NEAREST_ICON : STATION_ICON),
        getSize: (d) => (d.id === nearestId ? 26 : 20),
        sizeUnits: 'pixels',
        pickable: true,
        updateTriggers: { getIcon: [nearestId], getSize: [nearestId] },
      })
    );
  }

  if (alertedSpills.length > 0) {
    layers.push(
      new IconLayer<MapSpill>({
        id: LAYER_IDS.alertedBadge,
        data: alertedSpills,
        getPosition: (d) => [d.longitude, d.latitude],
        getIcon: () => ALERTED_ICON,
        getSize: 13,
        sizeUnits: 'pixels',
        getPixelOffset: [10, -10],
        pickable: false,
      })
    );
  }

  return layers;
}
