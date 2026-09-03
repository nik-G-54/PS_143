export interface SpillObservation {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface SpillSourceEstimate {
  latitude: number;
  longitude: number;
  radius_km: number;
}

export interface SpillAttribution {
  candidate_count: number;
  top_vessel: string | null;
  top_score: number | null;
}

export interface TrajectoryPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
}

export interface BacktrackResponse {
  spill_id: string;
  backtrack: {
    observation: SpillObservation;
    estimated_release_time: string;
    source_estimate: SpillSourceEstimate;
    // PENDING BACKEND CONTRACT: Expected to be an ordered array of geographic observations.
    trajectory?: TrajectoryPoint[];
  };
  attribution: SpillAttribution;
}

export interface AISTrackPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  heading?: number;
}

export interface VesselCandidate {
  vessel_id: string;
  is_mock?: boolean;
  rank?: number;
  score: number | null;
  vessel_name?: string;
  mmsi?: string;
  imo?: string;
  distance_to_origin_km?: number;
  track?: AISTrackPoint[]; // PENDING BACKEND CONTRACT
}

export interface VesselsResponse {
  spill_id?: string;
  candidate_count?: number;
  candidates: VesselCandidate[];
}
