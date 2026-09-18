import type { GeoBounds } from '../types/spillTypes';
import type {
  ForecastPoint,
  PredictedPosition,
  RawPredictedPosition,
  RawPredictResponse,
  SpillForecast,
} from '../types/forecastTypes';
import { haversineKm } from '../utils/geo';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isRenderableCoordinate = (longitude: unknown, latitude: unknown) =>
  isFiniteNumber(longitude) &&
  isFiniteNumber(latitude) &&
  longitude >= -180 &&
  longitude <= 180 &&
  latitude >= -90 &&
  latitude <= 90;

/** A path needs two distinct vertices; one lone position is not a forecast track. */
const MIN_FORECAST_POINTS = 2;

interface DatedPosition {
  longitude: number;
  latitude: number;
  timestamp: string;
  timestampMs: number;
  driftSpeedKnots: number | null;
  driftHeadingDeg: number | null;
}

function adaptPredictedPosition(
  raw: RawPredictedPosition | null | undefined
): PredictedPosition | null {
  if (!raw) return null;
  if (!isRenderableCoordinate(raw.longitude, raw.latitude)) return null;

  return {
    longitude: raw.longitude as number,
    latitude: raw.latitude as number,
  };
}

/**
 * Normalize a spill's forward drift forecast into a renderable track.
 *
 * Points are sorted into chronological order (nearest-term first), the same
 * defensive step the backtrack adapter applies to its trajectory — trusting the
 * payload's order would silently draw a scribble if the backend ever changed it.
 * `hoursFromNow` is then anchored to the *earliest* sorted point rather than to
 * `Date.now()`, so the normalized data is a pure function of the response: a
 * cached forecast re-rendered later doesn't have its offsets drift with however
 * long it sat in memory.
 *
 * Returns null when there is nothing to draw.
 */
export function adaptSpillForecast(
  spillId: string,
  raw: RawPredictResponse | null | undefined
): SpillForecast | null {
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
      driftSpeedKnots:
        isFiniteNumber(point?.drift_speed_knots) && point.drift_speed_knots >= 0
          ? point.drift_speed_knots
          : null,
      driftHeadingDeg: isFiniteNumber(point?.drift_heading_deg) ? point.drift_heading_deg : null,
    });
  }

  if (rejected > 0) {
    console.warn(
      `[forecastAdapter] dropped ${rejected} forecast point(s) for ${spillId} with an invalid position or timestamp`
    );
  }

  if (positions.length < MIN_FORECAST_POINTS) return null;

  positions.sort((a, b) => a.timestampMs - b.timestampMs);

  const startMs = positions[0].timestampMs;
  const horizonMs = positions[positions.length - 1].timestampMs;

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  let cumulativeKm = 0;

  const points: ForecastPoint[] = positions.map((position, index) => {
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
      hoursFromNow: (position.timestampMs - startMs) / 3_600_000,
      cumulativeKm,
      driftSpeedKnots: position.driftSpeedKnots,
      driftHeadingDeg: position.driftHeadingDeg,
    };
  });

  const predictedPosition = adaptPredictedPosition(raw.predicted_position);

  let bounds: GeoBounds = { minLon, minLat, maxLon, maxLat };
  if (predictedPosition) {
    bounds = {
      minLon: Math.min(bounds.minLon, predictedPosition.longitude),
      minLat: Math.min(bounds.minLat, predictedPosition.latitude),
      maxLon: Math.max(bounds.maxLon, predictedPosition.longitude),
      maxLat: Math.max(bounds.maxLat, predictedPosition.latitude),
    };
  }

  return {
    spillId,
    points,
    predictedPosition,
    bounds,
    totalDisplacementKm:
      isFiniteNumber(raw.total_displacement_km) && raw.total_displacement_km >= 0
        ? raw.total_displacement_km
        : null,
    netHeadingDeg: isFiniteNumber(raw.net_heading_deg) ? raw.net_heading_deg : null,
    averageSpeedKnots:
      isFiniteNumber(raw.average_speed_knots) && raw.average_speed_knots >= 0
        ? raw.average_speed_knots
        : null,
    durationHours: (horizonMs - startMs) / 3_600_000,
  };
}
