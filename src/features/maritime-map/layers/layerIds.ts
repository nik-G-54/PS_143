/**
 * deck.gl layer ids for the maritime map.
 *
 * Ids are shared state: the layer factories set them and the overlay's tooltip
 * dispatcher matches on them. Declaring them once means a rename cannot silently
 * switch a tooltip off.
 */
export const LAYER_IDS = {
  coastline: 'reference-coastline',
  graticule: 'reference-graticule',
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
  oceanFlowWind: 'ocean-flow-wind',
  oceanFlowCurrent: 'ocean-flow-current',
  vesselTracks: 'vessel-tracks',
  vesselMarkers: 'vessel-markers',
  vesselRevealShip: 'vessel-reveal-ship',
  vesselRevealLine: 'vessel-reveal-line',
  vesselRevealTicks: 'vessel-reveal-ticks',
  stationLink: 'station-link',
  stationLinkHit: 'station-link-hit',
  stationIcons: 'station-icons',
  stationCore: 'station-core',
  alertedBadge: 'alerted-spill-badge',
} as const;
