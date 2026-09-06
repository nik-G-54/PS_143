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

export interface RawAttributionTrajectoryResponse {
  spill_id?: string | null;
  backtrack_origin?: {
    latitude?: number | null;
    longitude?: number | null;
    timestamp?: string | null;
    radius_km?: number | null;
  } | null;
  attribution?: {
    top_vessel?: string | null;
    top_score?: number | null;
    rank?: number | null;
    candidate_count?: number | null;
  } | null;
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
  distanceFromOriginKm: number | null;
  /** Position at the backtrack origin time, when the backend provides one. */
  culpritLocation: VesselTrackPoint | null;
  /** Chronological AIS track (may be empty for vessels with no window coverage). */
  track: VesselTrackPoint[];
}

export interface SpillAttribution {
  spillId: string;
  topVesselId: string | null;
  candidateCount: number;
  vessels: AttributedVessel[];
  /** Vessels that have at least one drawable position (track or culprit). */
  drawableVessels: AttributedVessel[];
  bounds: GeoBounds | null;
}
