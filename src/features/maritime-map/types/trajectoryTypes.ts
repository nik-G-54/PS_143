// Oil drift trajectory contracts for the 2D maritime map.
//
// Source: `GET /api/v1/visualization/spills/{spill_id}`. That is the only endpoint
// serving a trajectory — `POST /api/v1/demo/spills/{id}/backtrack` answers with
// `observation`, a null `estimated_release_time` and `source_estimate` only, no
// path. (The optional `trajectory` on `BacktrackResponse` in src/types/api.ts is
// marked "PENDING BACKEND CONTRACT" and is never populated.)
//
// As with the spill list, `Raw*` mirrors the payload and is only ever touched by
// `adapters/trajectoryAdapter.ts`.

import type { GeoBounds } from './spillTypes';

/** One sample of the drift path. The API emits these newest-first. */
export interface RawTrajectoryPoint {
  timestamp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Backend's estimate of where the oil entered the water. */
export interface RawSourceEstimate {
  latitude?: number | null;
  longitude?: number | null;
  radius_km?: number | null;
}

/**
 * A wind or current reading at the detection. Part of the response contract and
 * carried here for completeness; the optional wind/current layers consume it in a
 * later phase.
 */
export interface RawEnvironmentVector {
  u?: number | null;
  v?: number | null;
  speed?: number | null;
  direction?: number | null;
  unit?: string | null;
}

export interface RawVisualizationResponse {
  spill?: {
    spill_id?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    detected_at?: string | null;
  } | null;
  source_estimate?: RawSourceEstimate | null;
  environment?: {
    wind?: RawEnvironmentVector | null;
    current?: RawEnvironmentVector | null;
  } | null;
  trajectory?: RawTrajectoryPoint[] | null;
}

/** One normalized drift position. */
export interface TrajectoryPoint {
  longitude: number;
  latitude: number;
  /** Original ISO-8601 timestamp, kept verbatim. */
  timestamp: string;
  timestampMs: number;
  /** Hours before the detection: 0 at the detection, growing backwards in time. */
  hoursBeforeDetection: number;
  /** Distance along the polyline from the oldest position, km. */
  cumulativeKm: number;
}

export interface SourceEstimate {
  longitude: number;
  latitude: number;
  /** Backend's positional uncertainty. A true geographic distance, not a symbol size. */
  radiusKm: number | null;
}

/**
 * A spill's backtracked drift path, normalized for rendering.
 *
 * This is where the oil *came from*, integrated backwards from the detection — not
 * a forecast of where it is going.
 */
export interface SpillTrajectory {
  spillId: string;
  /** Oldest → newest. See the adapter for why the API's order is reversed. */
  points: TrajectoryPoint[];
  source: SourceEstimate | null;
  /** Covers every point and the origin uncertainty circle, ready for the camera. */
  bounds: GeoBounds;
  /** Length of the polyline, km. */
  totalDistanceKm: number;
  /** Span from the oldest position to the detection, hours. */
  durationHours: number;
}

/** Normalized wind or current vector at the detection. */
export interface EnvironmentVector {
  u: number;
  v: number;
  /** Magnitude in the unit reported by the backend. */
  speed: number;
  /** Direction degrees (backend contract — visualize as-given). */
  directionDeg: number;
  unit: string;
}

/** Environment readings bundled with the visualization response. */
export interface SpillEnvironment {
  wind: EnvironmentVector | null;
  current: EnvironmentVector | null;
  /** Anchor for the optional arrow glyphs — the detection centroid. */
  longitude: number;
  latitude: number;
}
