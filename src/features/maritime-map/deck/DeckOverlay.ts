import { MapboxOverlay } from '@deck.gl/mapbox';
import type { PickingInfo } from '@deck.gl/core';
import type { MapSpill } from '../types/spillTypes';
import type { TrajectoryPoint } from '../types/trajectoryTypes';
import type { DriftOriginDatum } from '../layers/TrajectoryLayer';
import type { EnvArrow } from '../layers/EnvironmentLayer';
import type { AttributedVessel } from '../types/attributionTypes';
import type { TimelineVesselPosition } from '../timeline/useInvestigationTimeline';
import type { CulpritMarkerDatum } from '../layers/VesselLayer';
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
  return tooltip([
    title(spill.spillId),
    row('Detected', formatDetectedAt(spill)),
    row('Area', formatArea(spill.areaKm2)),
    row('Detection conf.', formatConfidence(spill.confidenceScore)),
    row('Candidates', formatCandidates(spill.candidateCount)),
    row('Centroid', formatCoordinates(spill)),
  ]);
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
    title('Estimated origin'),
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

function culpritMarkerTooltip(culprit: CulpritMarkerDatum) {
  const timeStr = culprit.timestamp ? formatUtcTimestamp(culprit.timestampMs) : '—';
  const distStr =
    culprit.distanceFromBacktrackOriginKm != null
      ? `${culprit.distanceFromBacktrackOriginKm.toFixed(2)} km`
      : '—';
  const speedStr = culprit.speed != null ? `${culprit.speed.toFixed(1)} kn` : null;
  const courseStr = culprit.course != null ? `${culprit.course.toFixed(0)}°` : null;

  const rows = [
    title('★ Potential Source Position'),
    row('Candidate', `#1 ${culprit.vesselName}`),
    row('Position Time', timeStr),
    row('Coordinates', formatLatLon(culprit.longitude, culprit.latitude)),
    row('Distance to Origin', distStr),
  ];
  if (speedStr || courseStr) {
    rows.push(row('Speed / Course', [speedStr, courseStr].filter(Boolean).join(' @ ')));
  }
  return tooltip(rows);
}

function vesselMarkerTooltip(vessel: TimelineVesselPosition) {
  const label = vessel.rank === 1 ? `★ Potential Source (#1 ${vessel.vesselName})` : `#${vessel.rank} ${vessel.vesselName}`;
  return tooltip([
    title(label),
    row('Position', formatLatLon(vessel.longitude, vessel.latitude)),
    row('Source', vessel.isMock ? 'Synthetic AIS' : 'Observed AIS'),
  ]);
}

function vesselTrackTooltip(vessel: AttributedVessel) {
  const pointsCount = vessel.trajectory ? vessel.trajectory.length : vessel.track.length;
  const dist =
    vessel.distanceFromBacktrackOriginKm != null
      ? `${vessel.distanceFromBacktrackOriginKm.toFixed(2)} km`
      : vessel.distanceFromOriginKm != null
        ? `${vessel.distanceFromOriginKm.toFixed(2)} km`
        : '—';
  return tooltip([
    title(vessel.rank === 1 ? `★ Potential Source (#1 ${vessel.vesselName})` : `#${vessel.rank} ${vessel.vesselName}`),
    row('Type', vessel.vesselType ?? '—'),
    row('Display points', String(pointsCount)),
    row('Origin dist.', dist),
    row('Source', vessel.isMock ? 'Synthetic Candidate' : 'Observed AIS Track'),
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
    case LAYER_IDS.culpritMarker:
      return culpritMarkerTooltip(info.object as CulpritMarkerDatum);
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
    interleaved: false,
    layers: [],
    getTooltip: getMaritimeTooltip,
  });
}
