// Mock `GET /api/v1/demo/spills/{spill_id}/predict` response, shaped for
// `adaptSpillForecast` (see `../adapters/forecastAdapter.ts`) ahead of any
// real backend wiring. Continues the same spill/origin as `attributionFixture.ts`.
//
// 25 hourly samples (0h..24h) with a slow easterly-to-northwesterly curve and
// gently decaying drift speed, generated deterministically so the fixture
// stays reviewable as numbers rather than as a giant hand-typed literal.

import type { RawPredictResponse } from '../types/forecastTypes';

const FORECAST_START_MS = Date.parse('2026-03-04T06:00:00Z');
const START_LATITUDE = 35.108;
const START_LONGITUDE = 23.994;

function buildTrajectory(): NonNullable<RawPredictResponse['trajectory']> {
  const points: NonNullable<RawPredictResponse['trajectory']> = [];
  let latitude = START_LATITUDE;
  let longitude = START_LONGITUDE;
  let distanceKm = 0;

  for (let hour = 0; hour <= 24; hour += 1) {
    if (hour > 0) {
      // Heading sweeps from ~300° to ~330° over the horizon; speed decays
      // from 1.6kn to ~0.6kn as the slick spreads and slows.
      const headingDeg = 300 + (30 * hour) / 24;
      const speedKnots = 1.6 - (1.0 * hour) / 24;
      const headingRad = (headingDeg * Math.PI) / 180;
      const stepKm = speedKnots * 1.852;
      const dLat = (stepKm * Math.cos(headingRad)) / 111.32;
      const dLon =
        (stepKm * Math.sin(headingRad)) / (111.32 * Math.cos((latitude * Math.PI) / 180));
      latitude += dLat;
      longitude += dLon;
      distanceKm += stepKm;
    }

    const headingDeg = 300 + (30 * hour) / 24;
    const speedKnots = Math.max(0.6, 1.6 - (1.0 * hour) / 24);

    points.push({
      timestamp: new Date(FORECAST_START_MS + hour * 3_600_000).toISOString(),
      latitude: Number(latitude.toFixed(5)),
      longitude: Number(longitude.toFixed(5)),
      drift_speed_knots: Number(speedKnots.toFixed(2)),
      drift_heading_deg: Number(headingDeg.toFixed(1)),
      distance_from_start_km: Number(distanceKm.toFixed(2)),
    });
  }

  return points;
}

const trajectory = buildTrajectory();
const last = trajectory[trajectory.length - 1];

export const mockForecastResponse: RawPredictResponse = {
  spill_id: 'spill_7f3a21',
  forecast_hours: 24,
  initial_position: {
    latitude: START_LATITUDE,
    longitude: START_LONGITUDE,
    timestamp: trajectory[0].timestamp,
  },
  trajectory,
  predicted_position: {
    latitude: last.latitude,
    longitude: last.longitude,
  },
  total_displacement_km: last.distance_from_start_km,
  net_heading_deg: last.drift_heading_deg,
  average_speed_knots: 1.1,
};
