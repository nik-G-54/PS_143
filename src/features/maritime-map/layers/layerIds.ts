/**
 * deck.gl layer ids for the maritime map.
 *
 * Ids are shared state: the layer factories set them and the overlay's tooltip
 * dispatcher matches on them. Declaring them once means a rename cannot silently
 * switch a tooltip off.
 */
export const LAYER_IDS = {
  spillPolygon: 'spill-polygon',
  spillDots: 'spill-dots',
  spillSelectionRing: 'spill-selection-ring',
  driftOriginUncertainty: 'drift-origin-uncertainty',
  driftPathGhostCasing: 'drift-path-ghost-casing',
  driftPathGhost: 'drift-path-ghost',
  driftPathCasing: 'drift-path-casing',
  driftPath: 'drift-path',
  driftTimeTicks: 'drift-time-ticks',
  driftOrigin: 'drift-origin',
  driftPlayhead: 'drift-playhead',
  forecastPathCasing: 'forecast-path-casing',
  forecastPath: 'forecast-path',
  forecastWaypoints: 'forecast-waypoints',
  forecastHeatmap: 'forecast-heatmap',
  windArrows: 'env-wind-arrows',
  currentArrows: 'env-current-arrows',
  vesselTracks: 'vessel-tracks',
  vesselMarkers: 'vessel-markers',
  vesselRevealShip: 'vessel-reveal-ship',
  vesselRevealLine: 'vessel-reveal-line',
  vesselRevealTicks: 'vessel-reveal-ticks',
} as const;
