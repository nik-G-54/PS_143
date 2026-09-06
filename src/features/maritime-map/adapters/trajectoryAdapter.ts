import type { GeoBounds } from '../types/spillTypes';
import type {
  EnvironmentVector,
  RawEnvironmentVector,
  RawSourceEstimate,
  RawVisualizationResponse,
  SourceEstimate,
  SpillEnvironment,
  SpillTrajectory,
  TrajectoryPoint,
} from '../types/trajectoryTypes';
import { expandBoundsByKm, haversineKm } from '../utils/geo';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isRenderableCoordinate = (longitude: unknown, latitude: unknown) =>
  isFiniteNumber(longitude) &&
  isFiniteNumber(latitude) &&
  longitude >= -180 &&
  longitude <= 180 &&
  latitude >= -90 &&
  latitude <= 90;

/** A path needs two distinct vertices; one lone position is not a trajectory. */
const MIN_TRAJECTORY_POINTS = 2;

interface DatedPosition {
  longitude: number;
  latitude: number;
  timestamp: string;
  timestampMs: number;
}

function adaptSourceEstimate(raw: RawSourceEstimate | null | undefined): SourceEstimate | null {
  if (!raw) return null;
  if (!isRenderableCoordinate(raw.longitude, raw.latitude)) return null;

  return {
    longitude: raw.longitude as number,
    latitude: raw.latitude as number,
    radiusKm: isFiniteNumber(raw.radius_km) && raw.radius_km > 0 ? raw.radius_km : null,
  };
}

function adaptEnvironmentVector(raw: RawEnvironmentVector | null | undefined): EnvironmentVector | null {
  if (!raw) return null;
  if (!isFiniteNumber(raw.u) || !isFiniteNumber(raw.v)) return null;
  if (!isFiniteNumber(raw.speed) || !isFiniteNumber(raw.direction)) return null;

  return {
    u: raw.u as number,
    v: raw.v as number,
    speed: raw.speed as number,
    directionDeg: raw.direction as number,
    unit: typeof raw.unit === 'string' && raw.unit ? raw.unit : 'm/s',
  };
}

/**
 * Pull wind/current readings from the visualization bundle.
 * Returns null when the detection centroid is missing — arrows need an anchor.
 */
export function adaptSpillEnvironment(
  raw: RawVisualizationResponse | null | undefined
): SpillEnvironment | null {
  if (!raw?.spill) return null;
  if (!isRenderableCoordinate(raw.spill.longitude, raw.spill.latitude)) return null;

  const wind = adaptEnvironmentVector(raw.environment?.wind);
  const current = adaptEnvironmentVector(raw.environment?.current);
  if (!wind && !current) return null;

  return {
    wind,
    current,
    longitude: raw.spill.longitude as number,
    latitude: raw.spill.latitude as number,
  };
}

/**
 * Normalize a spill's drift visualization into a renderable trajectory.
 *
 * Two things are reordered on the way through:
 *
 * 1. The API emits positions newest-first, walking backwards from the detection.
 *    They are sorted into chronological order here so `points[0]` is the oldest
 *    position and the last entry is the detection. Every consumer then reads the
 *    same direction the oil actually travelled: the path's vertex order, the time
 *    encoding along it, and a later timeline's playback all agree.
 * 2. Sorting rather than reversing, because trusting the payload's order would
 *    silently draw a scribble if the backend ever changed it.
 *
 * Returns null when there is nothing to draw.
 */
export function adaptSpillTrajectory(
  spillId: string,
  raw: RawVisualizationResponse | null | undefined
): SpillTrajectory | null {
  if (!raw) return null;

  const positions: DatedPosition[] = [];
  let rejected = 0;

  for (const point of raw.trajectory ?? []) {
    const timestamp = typeof point?.timestamp === 'string' ? point.timestamp : '';
    const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN;

    if (!isRenderableCoordinate(point?.longitude, point?.latitude) || Number.isNaN(timestampMs)) {
      rejected += 1;
      continue;
    }

    positions.push({
      longitude: point.longitude as number,
      latitude: point.latitude as number,
      timestamp,
      timestampMs,
    });
  }

  if (rejected > 0) {
    console.warn(
      `[trajectoryAdapter] dropped ${rejected} trajectory point(s) for ${spillId} with an invalid position or timestamp`
    );
  }

  if (positions.length < MIN_TRAJECTORY_POINTS) return null;

  positions.sort((a, b) => a.timestampMs - b.timestampMs);

  const oldestMs = positions[0].timestampMs;
  const detectionMs = positions[positions.length - 1].timestampMs;

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  let cumulativeKm = 0;

  const points: TrajectoryPoint[] = positions.map((position, index) => {
    if (index > 0) {
      const previous = positions[index - 1];
      cumulativeKm += haversineKm(
        previous.longitude,
        previous.latitude,
        position.longitude,
        position.latitude
      );
    }

    if (position.longitude < minLon) minLon = position.longitude;
    if (position.longitude > maxLon) maxLon = position.longitude;
    if (position.latitude < minLat) minLat = position.latitude;
    if (position.latitude > maxLat) maxLat = position.latitude;

    return {
      longitude: position.longitude,
      latitude: position.latitude,
      timestamp: position.timestamp,
      timestampMs: position.timestampMs,
      hoursBeforeDetection: (detectionMs - position.timestampMs) / 3_600_000,
      cumulativeKm,
    };
  });

  const source = adaptSourceEstimate(raw.source_estimate);

  let bounds: GeoBounds = { minLon, minLat, maxLon, maxLat };
  if (source) {
    bounds = {
      minLon: Math.min(bounds.minLon, source.longitude),
      minLat: Math.min(bounds.minLat, source.latitude),
      maxLon: Math.max(bounds.maxLon, source.longitude),
      maxLat: Math.max(bounds.maxLat, source.latitude),
    };
    // Keep the whole uncertainty circle inside the frame, not just its centre.
    if (source.radiusKm != null) bounds = expandBoundsByKm(bounds, source.radiusKm);
  }

  return {
    spillId,
    points,
    source,
    bounds,
    totalDistanceKm: cumulativeKm,
    durationHours: (detectionMs - oldestMs) / 3_600_000,
  };
}
