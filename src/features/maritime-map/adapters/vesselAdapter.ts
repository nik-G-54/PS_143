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

  const track: VesselTrackPoint[] = [];
  for (const point of raw.trajectory ?? []) {
    const adapted = adaptTrackPoint(point);
    if (adapted) track.push(adapted);
  }
  track.sort((a, b) => a.timestampMs - b.timestampMs);

  const rank = isFiniteNumber(raw.rank) && raw.rank > 0 ? Math.round(raw.rank) : 999;

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
    distanceFromOriginKm: isFiniteNumber(raw.distance_from_backtrack_origin_km)
      ? raw.distance_from_backtrack_origin_km
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
 * Normalize attribution trajectory into ranked vessels for deck.gl + panel UI.
 * Does not invent AIS positions — vessels without tracks stay list-only.
 */
export function adaptSpillAttribution(
  spillId: string,
  raw: RawAttributionTrajectoryResponse | null | undefined
): SpillAttribution | null {
  if (!raw) return null;

  const vessels: AttributedVessel[] = [];
  for (const item of raw.vessels ?? []) {
    const vessel = adaptVessel(item);
    if (vessel) vessels.push(vessel);
  }
  vessels.sort((a, b) => a.rank - b.rank);

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

  const origin = raw.backtrack_origin;
  if (origin && isRenderableCoordinate(origin.longitude, origin.latitude)) {
    bounds = expandBounds(bounds, origin.longitude as number, origin.latitude as number);
  }

  const drawableVessels = vessels.filter(
    (vessel) => vessel.track.length > 0 || vessel.culpritLocation != null
  );

  return {
    spillId,
    topVesselId:
      (typeof raw.attribution?.top_vessel === 'string' && raw.attribution.top_vessel) ||
      vessels[0]?.vesselId ||
      null,
    candidateCount:
      (isFiniteNumber(raw.attribution?.candidate_count)
        ? raw.attribution!.candidate_count!
        : vessels.length) || vessels.length,
    vessels,
    drawableVessels,
    bounds,
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
