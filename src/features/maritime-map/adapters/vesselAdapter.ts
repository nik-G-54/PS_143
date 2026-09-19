import type { GeoBounds } from '../types/spillTypes';
import type {
  AttributedVessel,
  RawAttributedVessel,
  RawAttributionTrackPoint,
  RawAttributionTrajectoryResponse,
  RawCulpritLocation,
  SpillAttribution,
  VesselTrackPoint,
} from '../types/attributionTypes';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isRenderableCoordinate = (longitude: unknown, latitude: unknown) =>
  isFiniteNumber(longitude) &&
  isFiniteNumber(latitude) &&
  longitude >= -180 &&
  longitude <= 180 &&
  latitude >= -90 &&
  latitude <= 90;

function adaptTrackPoint(
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

function adaptVessel(raw: RawAttributedVessel): AttributedVessel | null {
  const vesselId = typeof raw.vessel_id === 'string' ? raw.vessel_id.trim() : '';
  if (!vesselId) return null;

  const rawRank = isFiniteNumber(raw.rank) && raw.rank > 0 ? Math.round(raw.rank) : null;
  const rank = rawRank ?? 999;

  // Only keep vessel trajectory for Rank 1 vessel; remove trajectory for rank null vessels
  const isRank1 = rawRank === 1;
  const rawTrack = isRank1 ? (raw.trajectory ?? raw.track ?? []) : [];
  const track: VesselTrackPoint[] = [];
  for (const point of rawTrack) {
    const adapted = adaptTrackPoint(point);
    if (adapted) track.push(adapted);
  }
  track.sort((a, b) => a.timestampMs - b.timestampMs);

  const dist = isFiniteNumber(raw.distance_from_backtrack_origin_km)
    ? raw.distance_from_backtrack_origin_km
    : isFiniteNumber(raw.distance_to_origin_km)
    ? raw.distance_to_origin_km
    : null;

  return {
    vesselId,
    isMock: Boolean(raw.is_mock),
    rank,
    rawRank,
    score: isFiniteNumber(raw.score) ? raw.score : null,
    vesselName:
      (typeof raw.vessel_name === 'string' && raw.vessel_name.trim()) || vesselId,
    mmsi: raw.mmsi != null && String(raw.mmsi).trim() !== '' ? String(raw.mmsi).trim() : null,
    imo: raw.imo != null && String(raw.imo).trim() !== '' ? String(raw.imo).trim() : null,
    country: typeof raw.country === 'string' ? raw.country : null,
    vesselType: typeof raw.vessel_type === 'string' ? raw.vessel_type : null,
    speed: isFiniteNumber(raw.speed) ? raw.speed : null,
    course: isFiniteNumber(raw.course) ? raw.course : null,
    heading: isFiniteNumber(raw.heading) ? raw.heading : null,
    distanceFromOriginKm: dist,
    timeDifferenceHours: isFiniteNumber(raw.time_difference_hours)
      ? raw.time_difference_hours
      : null,
    trajectoryCorrelation: isFiniteNumber(raw.trajectory_correlation)
      ? raw.trajectory_correlation
      : null,
    culpritLocation: adaptTrackPoint(raw.culprit_location),
    track,
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
 * Normalize attribution trajectory and candidate vessels into ranked vessels for deck.gl + panel UI.
 * Merges metadata from `GET /vessels` with waypoint tracks from `GET /attribution/trajectory`.
 * Does not invent AIS positions — vessels without tracks stay list-only.
 */
export function adaptSpillAttribution(
  spillId: string,
  rawTrajectory: RawAttributionTrajectoryResponse | null | undefined,
  rawVessels?: { vessels?: RawAttributedVessel[] | null; candidate_count?: number | null } | null | undefined
): SpillAttribution | null {
  if (!rawTrajectory && !rawVessels) return null;

  // Index candidates from /vessels endpoint by vesselId for metadata enrichment
  const candidateMap = new Map<string, RawAttributedVessel>();
  for (const item of rawVessels?.vessels ?? []) {
    if (item.vessel_id) candidateMap.set(item.vessel_id.trim(), item);
  }

  const vessels: AttributedVessel[] = [];
  const seenIds = new Set<string>();

  // 1. Process vessels from trajectory response, merging candidate metadata
  for (const item of rawTrajectory?.vessels ?? []) {
    const id = item.vessel_id ? item.vessel_id.trim() : '';
    const candidate = candidateMap.get(id);
    // Merge: candidate metadata takes precedence for speed/course/distance, trajectory provides track
    const mergedRaw: RawAttributedVessel = {
      ...candidate,
      ...item,
      // Ensure candidate metadata fields are preserved if trajectory didn't provide them
      speed: candidate?.speed ?? item.speed,
      course: candidate?.course ?? item.course,
      heading: candidate?.heading ?? item.heading,
      distance_to_origin_km: candidate?.distance_to_origin_km ?? item.distance_to_origin_km,
      time_difference_hours: candidate?.time_difference_hours ?? item.time_difference_hours,
      trajectory_correlation: candidate?.trajectory_correlation ?? item.trajectory_correlation,
      trajectory: item.trajectory ?? candidate?.trajectory,
    };
    const vessel = adaptVessel(mergedRaw);
    if (vessel) {
      vessels.push(vessel);
      seenIds.add(vessel.vesselId);
    }
  }

  // 2. Add any candidate vessels that were not in the trajectory response
  for (const [id, candidate] of candidateMap.entries()) {
    if (!seenIds.has(id)) {
      const vessel = adaptVessel(candidate);
      if (vessel) {
        vessels.push(vessel);
        seenIds.add(vessel.vesselId);
      }
    }
  }

  vessels.sort((a, b) => a.rank - b.rank);

  // Normalize ranks so any vessel with fallback rank 999 is ranked sequentially (#2, #3, #4, ...)
  vessels.forEach((v, index) => {
    if (v.rank >= 999 || !v.rank) {
      v.rank = index + 1;
    }
  });

  let bounds: GeoBounds | null = null;
  for (const vessel of vessels) {
    for (const point of vessel.track) {
      bounds = expandBounds(bounds, point.longitude, point.latitude);
    }
    if (vessel.culpritLocation) {
      bounds = expandBounds(
        bounds,
        vessel.culpritLocation.longitude,
        vessel.culpritLocation.latitude
      );
    }
  }

  if (rawTrajectory?.backtrack_origin) {
    const { longitude, latitude } = rawTrajectory.backtrack_origin;
    if (isFiniteNumber(longitude) && isFiniteNumber(latitude)) {
      bounds = expandBounds(bounds, longitude, latitude);
    }
  }

  const drawableVessels = vessels.filter(
    (v) => v.track.length > 0 || v.culpritLocation != null
  );

  const candidateCount =
    rawVessels?.candidate_count ??
    rawTrajectory?.attribution?.candidate_count ??
    vessels.length;

  return {
    spillId,
    topVesselId:
      rawTrajectory?.attribution?.top_vessel ??
      (vessels.length > 0 ? vessels[0].vesselId : null),
    candidateCount,
    vessels,
    drawableVessels,
    bounds,
    withinBacktrackRadius:
      typeof rawTrajectory?.verification?.within_backtrack_radius === 'boolean'
        ? rawTrajectory.verification.within_backtrack_radius
        : null,
  };
}

/**
 * Interpolate a vessel's position at `timeMs` along its chronological track.
 * Falls back to culprit_location, then the nearest track endpoint.
 */
export function vesselPositionAt(
  vessel: AttributedVessel,
  timeMs: number
): { longitude: number; latitude: number; heading: number | null } | null {
  const track = vessel.track;
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
