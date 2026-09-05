// Vessel attribution contracts for the maritime map.
//
// Source: `GET /api/v1/demo/spills/{spill_id}/attribution/trajectory`
// Backend owns ranking, correlation and AIS tracks — the frontend only visualizes.

import type { GeoBounds } from './spillTypes';

export interface RawAttributionTrackPoint {
  timestamp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number | null;
  course?: number | null;
  heading?: number | null;
}

export interface RawCulpritLocation {
  timestamp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number | null;
  course?: number | null;
  heading?: number | null;
}

export interface RawAttributedVessel {
  vessel_id?: string | null;
  is_mock?: boolean | null;
  rank?: number | null;
  score?: number | null;
  vessel_name?: string | null;
  mmsi?: string | null;
  imo?: string | null;
  country?: string | null;
  vessel_type?: string | null;
  culprit_location?: RawCulpritLocation | null;
  distance_from_backtrack_origin_km?: number | null;
  trajectory?: RawAttributionTrackPoint[] | null;
}

export interface RawBacktrackOrigin {
  latitude?: number | null;
  longitude?: number | null;
  timestamp?: string | null;
  radius_km?: number | null;
}

export interface RawAttributionSummary {
  top_vessel?: string | null;
  top_score?: number | null;
  rank?: number | null;
  candidate_count?: number | null;
}

export interface RawAttributionVerification {
  culprit_vessel_id?: string | null;
  culprit_position_timestamp?: string | null;
  origin_to_culprit_distance_km?: number | null;
  within_backtrack_radius?: boolean | null;
  ais_points_in_window?: number | null;
  display_trajectory_points?: number | null;
  trajectory_window?: {
    start?: string | null;
    end?: string | null;
  } | null;
  nearest_origin_ais_point?: RawAttributionTrackPoint | null;
  timestamp_nearest_ais_point?: RawAttributionTrackPoint | null;
  timestamp_nearest_distance_from_origin_km?: number | null;
}

export interface RawAttributionTrajectoryResponse {
  spill_id?: string | null;
  backtrack_origin?: RawBacktrackOrigin | null;
  verification?: RawAttributionVerification | null;
  attribution?: RawAttributionSummary | null;
  vessels?: RawAttributedVessel[] | null;
}

/** One AIS sample along a vessel track. */
export interface VesselTrackPoint {
  longitude: number;
  latitude: number;
  timestamp: string;
  timestampMs: number;
  speed: number | null;
  course: number | null;
  heading: number | null;
}

export type VesselTrajectoryPoint = VesselTrackPoint;

export interface BacktrackOrigin {
  latitude: number;
  longitude: number;
  timestamp: string;
  timestampMs: number;
  radiusKm: number;
}

export interface AttributionVerification {
  culpritVesselId: string | null;
  culpritPositionTimestamp: string | null;
  culpritPositionTimestampMs: number | null;
  originToCulpritDistanceKm: number | null;
  withinBacktrackRadius: boolean | null;
  aisPointsInWindow: number;
  displayTrajectoryPoints: number;
  trajectoryWindow: {
    start: string;
    startMs: number;
    end: string;
    endMs: number;
  } | null;
  nearestOriginAisPoint: VesselTrackPoint | null;
  timestampNearestAisPoint: VesselTrackPoint | null;
  timestampNearestDistanceFromOriginKm: number | null;
}

/** Ranked candidate vessel ready for map + panel rendering. */
export interface AttributedVessel {
  vesselId: string;
  isMock: boolean;
  rank: number;
  score: number | null;
  vesselName: string;
  mmsi: string | null;
  imo: string | null;
  country: string | null;
  vesselType: string | null;
  distanceFromBacktrackOriginKm: number | null;
  distanceFromOriginKm: number | null;
  /** Position at the backtrack origin / attribution time. */
  culpritLocation: VesselTrackPoint | null;
  /** Chronological AIS track display points provided by backend. */
  trajectory: VesselTrackPoint[];
  track: VesselTrackPoint[];
}

export type VesselAttribution = AttributedVessel;

export interface SpillAttribution {
  spillId: string;
  backtrackOrigin: BacktrackOrigin | null;
  verification: AttributionVerification | null;
  attribution: {
    topVessel: string | null;
    topScore: number | null;
    rank: number;
    candidateCount: number;
  };
  topVesselId: string | null;
  candidateCount: number;
  vessels: AttributedVessel[];
  /** Vessels that have at least one drawable position (track or culprit). */
  drawableVessels: AttributedVessel[];
  bounds: GeoBounds | null;
}

export type VesselAttributionResponse = SpillAttribution;
