import type { GeoBounds } from '../types/spillTypes';
import type {
  AttributedVessel,
  AttributionVerification,
  BacktrackOrigin,
  RawAttributedVessel,
  RawAttributionTrackPoint,
  RawAttributionTrajectoryResponse,
  RawBacktrackOrigin,
  RawCulpritLocation,
  SpillAttribution,
  VesselTrackPoint,
} from '../types/attributionTypes';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isRenderableCoordinate = (longitude: unknown, latitude: unknown): boolean =>
  isFiniteNumber(longitude) &&
  isFiniteNumber(latitude) &&
  longitude >= -180 &&
  longitude <= 180 &&
  latitude >= -90 &&
  latitude <= 90;

/**
 * Adapt a track point or culprit location from raw API JSON.
 */
export function adaptTrackPoint(
  raw: RawAttributionTrackPoint | RawCulpritLocation | null | undefined
): VesselTrackPoint | null {
  if (!raw) return null;
  const timestamp = typeof raw.timestamp === 'string' ? raw.timestamp : '';
  const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN;
  if (!isRenderableCoordinate(raw.longitude, raw.latitude) || Number.isNaN(timestampMs)) {
    return null;
  }

  return {
    longitude: raw.longitude as number,
    latitude: raw.latitude as number,
    timestamp,
    timestampMs,
    speed: isFiniteNumber(raw.speed) ? raw.speed : null,
    course: isFiniteNumber(raw.course) ? raw.course : null,
    heading: isFiniteNumber(raw.heading) ? raw.heading : null,
  };
}

/**
 * Adapt a single vessel from raw backend response.
 * Preserves all backend display points without inventing or filtering coordinates.
 */
export function adaptAttributedVessel(raw: RawAttributedVessel): AttributedVessel | null {
  const vesselId = typeof raw.vessel_id === 'string' ? raw.vessel_id.trim() : '';
  if (!vesselId) return null;

  const trajectory: VesselTrackPoint[] = [];
  for (const point of raw.trajectory ?? []) {
    const adapted = adaptTrackPoint(point);
    if (adapted) trajectory.push(adapted);
  }
  trajectory.sort((a, b) => a.timestampMs - b.timestampMs);

  const rank = isFiniteNumber(raw.rank) && raw.rank > 0 ? Math.round(raw.rank) : 999;
  const distKm = isFiniteNumber(raw.distance_from_backtrack_origin_km)
    ? raw.distance_from_backtrack_origin_km
    : null;

  const culpritLocation = adaptTrackPoint(raw.culprit_location);

  return {
    vesselId,
    isMock: Boolean(raw.is_mock),
    rank,
    score: isFiniteNumber(raw.score) ? raw.score : null,
    vesselName:
      (typeof raw.vessel_name === 'string' && raw.vessel_name.trim()) || vesselId,
    mmsi: typeof raw.mmsi === 'string' ? raw.mmsi : null,
    imo: typeof raw.imo === 'string' ? raw.imo : null,
    country: typeof raw.country === 'string' ? raw.country : null,
    vesselType: typeof raw.vessel_type === 'string' ? raw.vessel_type : null,
    distanceFromBacktrackOriginKm: distKm,
    distanceFromOriginKm: distKm,
    culpritLocation,
    trajectory,
    track: trajectory,
  };
}

function adaptBacktrackOrigin(raw: RawBacktrackOrigin | null | undefined): BacktrackOrigin | null {
  if (!raw || !isRenderableCoordinate(raw.longitude, raw.latitude)) return null;
  const timestamp = typeof raw.timestamp === 'string' ? raw.timestamp : '';
  const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN;
  return {
    latitude: raw.latitude as number,
    longitude: raw.longitude as number,
    timestamp,
    timestampMs: Number.isNaN(timestampMs) ? 0 : timestampMs,
    radiusKm: isFiniteNumber(raw.radius_km) && raw.radius_km > 0 ? raw.radius_km : 0,
  };
}

function adaptVerification(
  raw: RawAttributionTrajectoryResponse['verification']
): AttributionVerification | null {
  if (!raw) return null;

  const culpritTimestamp =
    typeof raw.culprit_position_timestamp === 'string' ? raw.culprit_position_timestamp : null;
  const culpritTimestampMs = culpritTimestamp ? Date.parse(culpritTimestamp) : null;

  let trajectoryWindow: AttributionVerification['trajectoryWindow'] = null;
  if (raw.trajectory_window?.start && raw.trajectory_window?.end) {
    const startMs = Date.parse(raw.trajectory_window.start);
    const endMs = Date.parse(raw.trajectory_window.end);
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
      trajectoryWindow = {
        start: raw.trajectory_window.start,
        startMs,
        end: raw.trajectory_window.end,
        endMs,
      };
    }
  }

  return {
    culpritVesselId: typeof raw.culprit_vessel_id === 'string' ? raw.culprit_vessel_id : null,
    culpritPositionTimestamp: culpritTimestamp,
    culpritPositionTimestampMs: Number.isNaN(culpritTimestampMs) ? null : culpritTimestampMs,
    originToCulpritDistanceKm: isFiniteNumber(raw.origin_to_culprit_distance_km)
      ? raw.origin_to_culprit_distance_km
      : null,
    withinBacktrackRadius:
      typeof raw.within_backtrack_radius === 'boolean' ? raw.within_backtrack_radius : null,
    aisPointsInWindow: isFiniteNumber(raw.ais_points_in_window)
      ? raw.ais_points_in_window
      : 0,
    displayTrajectoryPoints: isFiniteNumber(raw.display_trajectory_points)
      ? raw.display_trajectory_points
      : 0,
    trajectoryWindow,
    nearestOriginAisPoint: adaptTrackPoint(raw.nearest_origin_ais_point),
    timestampNearestAisPoint: adaptTrackPoint(raw.timestamp_nearest_ais_point),
    timestampNearestDistanceFromOriginKm: isFiniteNumber(raw.timestamp_nearest_distance_from_origin_km)
      ? raw.timestamp_nearest_distance_from_origin_km
      : null,
  };
}

function expandBounds(bounds: GeoBounds | null, lon: number, lat: number): GeoBounds {
  if (!bounds) return { minLon: lon, minLat: lat, maxLon: lon, maxLat: lat };
  return {
    minLon: Math.min(bounds.minLon, lon),
    minLat: Math.min(bounds.minLat, lat),
    maxLon: Math.max(bounds.maxLon, lon),
    maxLat: Math.max(bounds.maxLat, lat),
  };
}

/**
 * Normalize raw attribution trajectory API response into camelCase frontend types.
 *
 * Requirements:
 * - Never filter out Rank 1 or any valid rank (supports 1..N dynamically).
 * - Reads candidate count, display points, and window from API verification/attribution.
 * - Does not invent historical AIS points.
 */
export function adaptAttributionTrajectory(
  raw: RawAttributionTrajectoryResponse | null | undefined,
  fallbackSpillId = ''
): SpillAttribution | null {
  if (!raw) return null;

  const spillId = (typeof raw.spill_id === 'string' && raw.spill_id.trim()) || fallbackSpillId;

  const vessels: AttributedVessel[] = [];
  for (const item of raw.vessels ?? []) {
    const vessel = adaptAttributedVessel(item);
    if (vessel) vessels.push(vessel);
  }
  vessels.sort((a, b) => a.rank - b.rank);

  const backtrackOrigin = adaptBacktrackOrigin(raw.backtrack_origin);
  const verification = adaptVerification(raw.verification);

  // Compute spatial bounds covering backtrack origin, culprit locations, and trajectory points.
  // Note: Extreme spatial outliers (>2.5 deg from incident center) are excluded strictly
  // from camera bounds calculation so the scene stays nicely framed, while ALL points remain
  // preserved in vessel.trajectory.
  let bounds: GeoBounds | null = null;
  const refLon =
    backtrackOrigin?.longitude ??
    vessels[0]?.culpritLocation?.longitude ??
    vessels[0]?.trajectory[0]?.longitude;
  const refLat =
    backtrackOrigin?.latitude ??
    vessels[0]?.culpritLocation?.latitude ??
    vessels[0]?.trajectory[0]?.latitude;

  const isLocalToIncident = (lon: number, lat: number) => {
    if (refLon === undefined || refLat === undefined) return true;
    return Math.abs(lon - refLon) <= 2.5 && Math.abs(lat - refLat) <= 2.5;
  };

  if (backtrackOrigin) {
    bounds = expandBounds(bounds, backtrackOrigin.longitude, backtrackOrigin.latitude);
  }

  for (const vessel of vessels) {
    if (
      vessel.culpritLocation &&
      isLocalToIncident(vessel.culpritLocation.longitude, vessel.culpritLocation.latitude)
    ) {
      bounds = expandBounds(
        bounds,
        vessel.culpritLocation.longitude,
        vessel.culpritLocation.latitude
      );
    }
    for (const pt of vessel.trajectory) {
      if (isLocalToIncident(pt.longitude, pt.latitude)) {
        bounds = expandBounds(bounds, pt.longitude, pt.latitude);
      }
    }
  }

  const topVesselId =
    (typeof raw.attribution?.top_vessel === 'string' && raw.attribution.top_vessel) ||
    verification?.culpritVesselId ||
    vessels[0]?.vesselId ||
    null;

  const candidateCount =
    (isFiniteNumber(raw.attribution?.candidate_count)
      ? raw.attribution!.candidate_count!
      : vessels.length) || vessels.length;

  const drawableVessels = vessels.filter(
    (vessel) => vessel.trajectory.length > 0 || vessel.culpritLocation != null
  );

  return {
    spillId,
    backtrackOrigin,
    verification,
    attribution: {
      topVessel: topVesselId,
      topScore: isFiniteNumber(raw.attribution?.top_score) ? raw.attribution.top_score : null,
      rank: isFiniteNumber(raw.attribution?.rank) ? raw.attribution.rank : 1,
      candidateCount,
    },
    topVesselId,
    candidateCount,
    vessels,
    drawableVessels,
    bounds,
  };
}

/**
 * Backward-compatible alias.
 */
export const adaptSpillAttribution = (
  spillId: string,
  raw: RawAttributionTrajectoryResponse | null | undefined
) => adaptAttributionTrajectory(raw, spillId);

/**
 * Interpolate a vessel's visual position at `timeMs` along its backend display points.
 *
 * NOTE: This is purely a transient visual render position for animation;
 * it does NOT mutate or add new historical AIS observations.
 */
export function vesselPositionAt(
  vessel: AttributedVessel,
  timeMs: number
): { longitude: number; latitude: number; heading: number | null } | null {
  const track = vessel.trajectory;
  if (track.length === 0) {
    if (!vessel.culpritLocation) return null;
    return {
      longitude: vessel.culpritLocation.longitude,
      latitude: vessel.culpritLocation.latitude,
      heading: vessel.culpritLocation.heading ?? vessel.culpritLocation.course,
    };
  }

  if (timeMs <= track[0].timestampMs) {
    return {
      longitude: track[0].longitude,
      latitude: track[0].latitude,
      heading: track[0].heading ?? track[0].course,
    };
  }

  const last = track[track.length - 1];
  if (timeMs >= last.timestampMs) {
    return {
      longitude: last.longitude,
      latitude: last.latitude,
      heading: last.heading ?? last.course,
    };
  }

  for (let i = 1; i < track.length; i += 1) {
    const a = track[i - 1];
    const b = track[i];
    if (timeMs > b.timestampMs) continue;

    const span = b.timestampMs - a.timestampMs;
    const t = span > 0 ? (timeMs - a.timestampMs) / span : 0;
    return {
      longitude: a.longitude + (b.longitude - a.longitude) * t,
      latitude: a.latitude + (b.latitude - a.latitude) * t,
      heading: b.heading ?? b.course ?? a.heading ?? a.course,
    };
  }

  return {
    longitude: last.longitude,
    latitude: last.latitude,
    heading: last.heading ?? last.course,
  };
}
