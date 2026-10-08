// Labels for the nearest-coast-guard line: "NEAREST COAST GUARD · 42 km" pinned
// at the line's midpoint and the station's own name at the station end.
//
// These go through the same HTML-marker badge system as "DETECTION" /
// "PROBABLE SOURCE" (see timeTickMarkers.ts), not a deck.gl TextLayer — that
// file explains why TextLayer can't be used on this globe. Reusing it means
// identical visuals and the same screen-space declutter. Content comes from
// `utils/stationLabelData.ts`.

import type { Map as MapLibreMap } from 'maplibre-gl';
import { buildStationLabelData, type StationLabelInput } from '../utils/stationLabelData';
import { removeTimeTickMarkers, updateTimeTickMarkers } from './timeTickMarkers';

const PREFIX = 'station-link';

export function showStationLabels(map: MapLibreMap, input: StationLabelInput): void {
  updateTimeTickMarkers(map, PREFIX, buildStationLabelData(input));
}

export function hideStationLabels(map: MapLibreMap): void {
  removeTimeTickMarkers(PREFIX, map);
}
