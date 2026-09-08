import { MapboxOverlay } from '@deck.gl/mapbox';
import type { PickingInfo } from '@deck.gl/core';
import type { MapSpill } from '../types/spillTypes';
import type { TrajectoryPoint } from '../types/trajectoryTypes';
import type { DriftOriginDatum } from '../layers/TrajectoryLayer';
import type { EnvArrow } from '../layers/EnvironmentLayer';
import type { AttributedVessel } from '../types/attributionTypes';
import type { TimelineVesselPosition } from '../timeline/useInvestigationTimeline';
import { LAYER_IDS } from '../layers/layerIds';
import {
  formatArea,
  formatCandidates,
  formatConfidence,
  formatCoordinates,
  formatDetectedAt,
  formatLatLon,
  formatUtcTimestamp,
} from '../utils/formatSpill';
import {
  formatDistanceKm,
  formatDriftWindow,
  formatHoursBeforeDetection,
  formatUncertaintyRadius,
} from '../utils/formatTrajectory';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });

const title = (value: string) =>
  `<div class="maritime-tooltip__title">${escapeHtml(value)}</div>`;

const row = (label: string, value: string) =>
  `<div class="maritime-tooltip__row"><span>${label}</span><span>${escapeHtml(value)}</span></div>`;

/**
 * deck.gl writes its own colour, background and padding straight onto the tooltip
 * element's inline style at creation, and inline declarations outrank any class rule.
 * Assigning an empty string removes those declarations, handing the appearance back
 * to `.maritime-tooltip` in maritime-map.css so the tooltip can follow the theme.
 */
const TOOLTIP_STYLE_RESET = {
  backgroundColor: '',
  color: '',
  padding: '',
} as const;

const tooltip = (rows: string[]) => ({
  html: rows.join(''),
  className: 'maritime-tooltip',
  style: TOOLTIP_STYLE_RESET,
});

function spillTooltip(spill: MapSpill) {
  const rows = [
    title(`OIL SPILL — ${spill.spillId}`),
    row('Detected', formatDetectedAt(spill)),
    row('Area', formatArea(spill.areaKm2)),
    row('Confidence', formatConfidence(spill.confidenceScore)),
  ];
  if (spill.sourceType) {
    row('Source type', spill.sourceType);
  }
  if (spill.candidateCount != null) {
    row('Candidates', formatCandidates(spill.candidateCount));
  }
  row('Centroid', formatCoordinates(spill));
  return tooltip(rows);
}

function driftPositionTooltip(point: TrajectoryPoint) {
  return tooltip([
    title('Drift position'),
    row('Time', formatUtcTimestamp(point.timestampMs)),
    row('Age', formatHoursBeforeDetection(point.hoursBeforeDetection)),
    row('From origin', formatDistanceKm(point.cumulativeKm)),
    row('Position', formatLatLon(point.longitude, point.latitude)),
  ]);
}

function driftOriginTooltip(origin: DriftOriginDatum) {
  return tooltip([
    title('PROBABLE SOURCE'),
    row('Position', formatLatLon(origin.longitude, origin.latitude)),
    row('Uncertainty', formatUncertaintyRadius(origin.radiusKm)),
    row('Window start', formatUtcTimestamp(origin.windowStartMs)),
    row('Backtracked', formatDriftWindow(origin.durationHours)),
    row('Path length', formatDistanceKm(origin.totalDistanceKm)),
  ]);
}

function envArrowTooltip(arrow: EnvArrow) {
  const kind = arrow.kind === 'wind' ? 'Wind' : 'Current';
  return tooltip([
    title(kind),
    row('Speed', `${arrow.speed.toFixed(2)} ${arrow.unit}`),
    row('Direction', `${arrow.directionDeg.toFixed(1)}°`),
  ]);
}

function vesselMarkerTooltip(vessel: TimelineVesselPosition) {
  return tooltip([
    title(`#${vessel.rank} ${vessel.vesselName}`),
    row('Position', formatLatLon(vessel.longitude, vessel.latitude)),
    row('Source', vessel.isMock ? 'Synthetic AIS' : 'Observed AIS'),
  ]);
}

function vesselTrackTooltip(vessel: AttributedVessel) {
  return tooltip([
    title(`#${vessel.rank} ${vessel.vesselName}`),
    row('Type', vessel.vesselType ?? '—'),
    row('Track points', String(vessel.track.length)),
    row(
      'Origin dist.',
      vessel.distanceFromOriginKm != null ? `${vessel.distanceFromOriginKm.toFixed(2)} km` : '—'
    ),
  ]);
}

/**
 * Route a hover to the right readout.
 *
 * Dispatching on layer id keeps each tooltip's shape tied to the datum its layer
 * actually carries, rather than probing the object for fields to guess at.
 */
function getMaritimeTooltip(info: PickingInfo) {
  if (!info.object) return null;

  switch (info.layer?.id) {
    case LAYER_IDS.spillDots:
      return spillTooltip(info.object as MapSpill);
    case LAYER_IDS.driftTimeTicks:
      return driftPositionTooltip(info.object as TrajectoryPoint);
    case LAYER_IDS.driftOrigin:
      return driftOriginTooltip(info.object as DriftOriginDatum);
    case LAYER_IDS.windArrows:
    case `${LAYER_IDS.windArrows}-head`:
    case LAYER_IDS.currentArrows:
    case `${LAYER_IDS.currentArrows}-head`:
      return envArrowTooltip(info.object as EnvArrow);
    case LAYER_IDS.vesselMarkers:
      return vesselMarkerTooltip(info.object as TimelineVesselPosition);
    case LAYER_IDS.vesselTracks:
      return vesselTrackTooltip(info.object as AttributedVessel);
    default:
      return null;
  }
}

export function createDeckOverlay(): MapboxOverlay {
  return new MapboxOverlay({
    // Overlaid rather than interleaved: overlaid layers survive `map.setStyle()`,
    // whereas interleaved custom layers are dropped when the style is swapped for
    // a theme or basemap change.
    //
    // Projection is not a concern either way — MapboxOverlay mirrors MapLibre's
    // own projection, handing layers a GlobeViewport while the globe is active and
    // a WebMercatorViewport once MapLibre transitions to Mercator at high zoom.
    // Verified against `map.project()` at zoom 1.8 and 13.25: 0 px difference.
    interleaved: false,
    layers: [],
    getTooltip: getMaritimeTooltip,
  });
}
