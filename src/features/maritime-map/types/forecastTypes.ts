// Forward drift forecast contracts for the 2D maritime map.
//
// Source: `GET /api/v1/demo/spills/{spill_id}/predict` (see `../api/forecastApi.ts`).
//
// Mirrors `trajectoryTypes.ts`'s backtrack contract, but runs the opposite
// direction in time: backtrack integrates *backwards* from a detection to find
// where the oil came from, this integrates *forwards* from the latest known
// position to predict where it is going. That flip is why every time-offset
// field here is `hoursFromNow` rather than `hoursBeforeDetection` — reusing the
// backtrack name on a forward-growing quantity would silently invert its
// meaning for anyone who already learned that name from the trajectory contract.
//
// As with the trajectory contract, `Raw*` mirrors the payload and is only ever
// touched by `adapters/forecastAdapter.ts`.

import type { GeoBounds } from './spillTypes';

/** One sample of the predicted forward path. The API's ordering is not trusted;
 *  see the adapter. */
export interface RawForecastPoint {
  timestamp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Instantaneous drift speed at this point, knots. */
  drift_speed_knots?: number | null;
  /** Instantaneous drift heading at this point, degrees. */
  drift_heading_deg?: number | null;
  /** Backend-reported distance from the forecast start, km — the adapter recomputes `cumulativeKm` itself (see below) rather than trusting this, but it's kept on the raw type for parity checks. */
  distance_from_start_km?: number | null;
}

/** Backend's headline answer: where the oil is predicted to end up at the
 *  forecast horizon. */
export interface RawPredictedPosition {
  latitude?: number | null;
  longitude?: number | null;
}

export interface RawPredictResponse {
  spill_id?: string | null;
  /** Requested forecast horizon, hours — the adapter derives its own `durationHours` from the trajectory span, so this is informational (e.g. for a "forecast to +Nh" label). */
  forecast_hours?: number | null;
  initial_position?: {
    latitude?: number | null;
    longitude?: number | null;
    timestamp?: string | null;
  } | null;
  trajectory?: RawForecastPoint[] | null;
  predicted_position?: RawPredictedPosition | null;
  /** Straight-line distance from the forecast start to `predicted_position`, km. */
  total_displacement_km?: number | null;
  /** Bearing of that straight-line displacement, degrees. */
  net_heading_deg?: number | null;
  average_speed_knots?: number | null;
}

/** One normalized forward drift position. */
export interface ForecastPoint {
  longitude: number;
  latitude: number;
  /** Original ISO-8601 timestamp, kept verbatim. */
  timestamp: string;
  timestampMs: number;
  /** Hours from now: 0 at the forecast start, growing forwards in time. */
  hoursFromNow: number;
  /** Distance along the polyline from the nearest-term position, km. */
  cumulativeKm: number;
  /**
   * Instantaneous drift speed at this point, knots. Distinct from
   * `SpillForecast.averageSpeedKnots` — that is one summary figure for the
   * whole forecast; this is per-point and can vary point to point. Null when
   * the backend didn't report a usable value for this sample.
   */
  driftSpeedKnots: number | null;
  /** Instantaneous drift heading at this point, degrees (backend contract — visualize as-given). */
  driftHeadingDeg: number | null;
}

/** The backend's headline predicted position, normalized. */
export interface PredictedPosition {
  longitude: number;
  latitude: number;
}

/**
 * A spill's forward drift forecast, normalized for rendering.
 *
 * This is where the oil is predicted to go, integrated forwards from the latest
 * known position — the mirror image of `SpillTrajectory`, which looks backwards
 * from a detection to an origin.
 */
export interface SpillForecast {
  spillId: string;
  /** Nearest-term → furthest-term. See the adapter for why the order is enforced. */
  points: ForecastPoint[];
  predictedPosition: PredictedPosition | null;
  /** Covers every point and the predicted position, ready for the camera. */
  bounds: GeoBounds;
  /**
   * Backend's net straight-line displacement over the forecast horizon, km.
   * Not the polyline length — a curved drift path can travel further than this
   * start-to-end vector magnitude implies. Null when the backend didn't report
   * a usable value; a missing measurement must render as "unknown", not as 0.
   */
  totalDisplacementKm: number | null;
  /** Bearing of that net displacement (backend contract — visualize as-given). */
  netHeadingDeg: number | null;
  /**
   * Backend's average drift speed over the whole forecast horizon — a single
   * summary figure, not a replacement for each point's own `driftSpeedKnots`.
   */
  averageSpeedKnots: number | null;
  /** Span from now to the furthest-term forecast position, hours. */
  durationHours: number;
}
