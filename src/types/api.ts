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

export interface VesselCandidate {
  vessel_id: string;
  score: number | null;
}

export interface VesselsResponse {
  candidates: VesselCandidate[];
}
