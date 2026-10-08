// Content of the nearest-coast-guard labels. Pure (type-only imports), so it is
// tested without MapLibre; `map/stationMarkers.ts` turns it into map markers.

import type { CoastGuardStation } from '../types/alertTypes';
import type { TimeTickMarkerDatum } from '../map/timeTickMarkers';
import { buildLinkLabel } from './stationLinkText';

/** Same amber as the line itself (StationLayer's LINK_RGBA). */
const LABEL_COLOR = '#f59e0b';

export interface StationLabelInput {
  station: CoastGuardStation;
  distanceKm: number;
  /** [lon, lat] great-circle midpoint of the line. */
  midpoint: [number, number];
}

export function buildStationLabelData(input: StationLabelInput): TimeTickMarkerDatum[] {
  return [
    {
      longitude: input.midpoint[0],
      latitude: input.midpoint[1],
      title: buildLinkLabel(input.distanceKm),
      color: LABEL_COLOR,
      variant: 'endpoint',
    },
    {
      longitude: input.station.lon,
      latitude: input.station.lat,
      title: input.station.name || input.station.id,
      color: LABEL_COLOR,
      variant: 'tick',
    },
  ];
}
