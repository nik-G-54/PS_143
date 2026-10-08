// Nearest-coast-guard layer: the dashed link from the selected spill to its
// nearest station, a marker on every station, and a spill-coloured ring on spills that
// have already been alerted.
//
// Markers are ScatterplotLayers, the same primitive the spill dots use. A
// deck.gl IconLayer was tried first and draws nothing on this MapLibre globe
// (verified in the browser even with a plain explicit atlas), so it is not used.
// Fixed colours on a dark disc keep the markers readable on light and dark basemaps.

import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import type { Layer } from '@deck.gl/core';
import * as turf from '@turf/turf';
import type { CoastGuardStation, NearestStation } from '../types/alertTypes';
import type { MapSpill } from '../types/spillTypes';
import { LAYER_IDS } from './layerIds';
import { radiusForArea, SPILL_RGB } from './spillEncoding';

export interface StationLayerOptions {
  stations: CoastGuardStation[];
  /** Nearest station to the selected spill, or null when nothing is selected. */
  nearest: NearestStation | null;
  selectedSpill: MapSpill | null;
  /** Spills with a successful alert in the log. */
  alertedSpills: MapSpill[];
  /** Same scale the spill dots use (`createAreaScale`), so an alert ring hugs its dot. */
  maxSqrtArea: number;
  /** The "Nearest coast guard" layer toggle. Off hides the line and every station marker. */
  visible: boolean;
  /** Pointer is over the line — draws it thicker and brighter. */
  linkHovered: boolean;
  onLinkHover?: (hovered: boolean) => void;
  onStationClick?: (stationId: string) => void;
}

const LINK_RGBA: [number, number, number, number] = [245, 158, 11, 230];
const LINK_HOVER_RGBA: [number, number, number, number] = [253, 186, 60, 255];
/** Wide, near-invisible companion line so the thin dashed one is easy to hover. */
const LINK_HIT_RGBA: [number, number, number, number] = [0, 0, 0, 1];

const DISC_RGBA: [number, number, number, number] = [15, 23, 42, 235];
const NEAREST_RGBA: [number, number, number, number] = [245, 158, 11, 255];
const STATION_RGBA: [number, number, number, number] = [148, 163, 184, 255];
/** Same hue as the spill dots, so the ring reads as part of the dot rather than a second colour. */
const ALERTED_RGBA: [number, number, number, number] = [...SPILL_RGB, 255];

/** One drawn segment of the spill → station line, carrying what its tooltip needs. */
export interface StationLinkDatum {
  path: [number, number][];
  station: CoastGuardStation;
  distanceKm: number;
}

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

/** The great-circle midpoint of the line — where its label is pinned. */
export function linkMidpoint(from: [number, number], to: [number, number]): [number, number] {
  const { coordinates } = turf.midpoint(from, to).geometry;
  return [coordinates[0], coordinates[1]];
}

export function createStationLayers(options: StationLayerOptions): Layer[] {
  const {
    stations,
    nearest,
    selectedSpill,
    alertedSpills,
    maxSqrtArea,
    visible,
    linkHovered,
    onLinkHover,
    onStationClick,
  } = options;
  const layers: Layer[] = [];

  // The whole nearest-coast-guard layer — line and markers (and, via
  // MaritimeMap, its labels and card) — needs the toggle on AND a spill to
  // measure from.
  if (visible && selectedSpill && nearest) {
    const data: StationLinkDatum[] = linkPaths(
      [selectedSpill.longitude, selectedSpill.latitude],
      [nearest.station.lon, nearest.station.lat]
    ).map((path) => ({ path, station: nearest.station, distanceKm: nearest.distanceKm }));

    layers.push(
      new PathLayer<StationLinkDatum>({
        id: LAYER_IDS.stationLinkHit,
        data,
        getPath: (d) => d.path,
        getColor: LINK_HIT_RGBA,
        getWidth: 16,
        widthUnits: 'pixels',
        pickable: true,
        onHover: (info) => onLinkHover?.(Boolean(info.object)),
      }),
      new PathLayer<StationLinkDatum, { getDashArray: number[]; dashJustified: boolean }>({
        id: LAYER_IDS.stationLink,
        data,
        getPath: (d) => d.path,
        getColor: linkHovered ? LINK_HOVER_RGBA : LINK_RGBA,
        getWidth: linkHovered ? 3.25 : 2,
        widthUnits: 'pixels',
        widthMinPixels: linkHovered ? 3 : 1.5,
        getDashArray: [5, 3],
        dashJustified: true,
        extensions: [new PathStyleExtension({ dash: true })],
        pickable: false,
        updateTriggers: { getColor: [linkHovered], getWidth: [linkHovered] },
      })
    );
  }

  if (visible && selectedSpill && stations.length > 0) {
    const nearestId = nearest?.station.id ?? null;
    const isNearest = (d: CoastGuardStation) => d.id === nearestId;
    layers.push(
      // Dark disc with a coloured ring — the clickable, hoverable marker.
      new ScatterplotLayer<CoastGuardStation>({
        id: LAYER_IDS.stationIcons,
        data: stations,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => (isNearest(d) ? 12 : 8),
        radiusUnits: 'pixels',
        filled: true,
        getFillColor: DISC_RGBA,
        stroked: true,
        getLineColor: (d) => (isNearest(d) ? NEAREST_RGBA : STATION_RGBA),
        getLineWidth: (d) => (isNearest(d) ? 3 : 2),
        lineWidthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 70],
        onClick: (info) => {
          if (!info.object) return false;
          onStationClick?.(info.object.id);
          // Stop the click here so it never reaches the basemap behind the marker.
          return true;
        },
        updateTriggers: { getRadius: [nearestId], getLineColor: [nearestId], getLineWidth: [nearestId] },
      }),
      // Solid core, so the marker reads as a target rather than just another ring.
      new ScatterplotLayer<CoastGuardStation>({
        id: LAYER_IDS.stationCore,
        data: stations,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => (isNearest(d) ? 4.5 : 3),
        radiusUnits: 'pixels',
        filled: true,
        getFillColor: (d) => (isNearest(d) ? NEAREST_RGBA : STATION_RGBA),
        stroked: false,
        pickable: false,
        updateTriggers: { getRadius: [nearestId], getFillColor: [nearestId] },
      })
    );
  }

  if (alertedSpills.length > 0) {
    layers.push(
      new ScatterplotLayer<MapSpill>({
        id: LAYER_IDS.alertedBadge,
        data: alertedSpills,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: (d) => radiusForArea(d.areaKm2, maxSqrtArea) + 4,
        radiusUnits: 'pixels',
        filled: false,
        stroked: true,
        getLineColor: ALERTED_RGBA,
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        pickable: false,
        updateTriggers: { getRadius: [maxSqrtArea] },
      })
    );
  }

  return layers;
}
