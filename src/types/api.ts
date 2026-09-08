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
  course?: number | null;
  speed?: number | null;
}

export interface VesselCandidate {
  vessel_id: string;
  is_mock?: boolean;
  rank?: number | null;
  score: number | null;
  vessel_name?: string | null;
  mmsi?: string | null;
  imo?: string | null;
  distance_to_origin_km?: number | null;
  track?: AISTrackPoint[]; // PENDING BACKEND CONTRACT
  culprit_location?: { latitude: number; longitude: number } | null;
  culprit_position_timestamp?: string | null;
}

export interface VesselsResponse {
  spill_id?: string;
  candidate_count?: number;
  vessels: VesselCandidate[];
}

export interface VisualizationSpill {
  spill_id: string;
  latitude: number;
  longitude: number;
  detected_at: string;
}

export interface WindCondition {
  u: number;
  v: number;
  speed: number;
  direction: number;
  unit: string;
}

export interface CurrentCondition {
  u: number;
  v: number;
  speed: number;
  direction: number;
  unit: string;
}

export interface EnvironmentConditions {
  wind: WindCondition;
  current: CurrentCondition;
}

export interface VisualizationSpillResponse {
  spill: VisualizationSpill;
  source_estimate: SpillSourceEstimate;
  environment: EnvironmentConditions;
  trajectory: TrajectoryPoint[];
}

export interface VesselTrajectoryPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  course: number | null;
  heading: number | null;
}

export interface CorrelatedVessel {
  vessel_id: string;
  is_mock: boolean;
  rank: number;
  score: number;
  vessel_name: string | null;
  mmsi: string | null;
  imo: string | null;
  country: string | null;
  vessel_type: string | null;
  culprit_location: { latitude: number; longitude: number } | null;
  distance_from_backtrack_origin_km: number | null;
  trajectory: VesselTrajectoryPoint[];
}

export interface AttributionTrajectoryResponse {
  spill_id: string;
  backtrack_origin: {
    latitude: number;
    longitude: number;
    timestamp: string;
    radius_km: number;
  };
  verification: {
    culprit_vessel_id: string;
    culprit_position_timestamp: string;
    origin_to_culprit_distance_km: number;
    within_backtrack_radius: boolean;
    ais_points_in_window: number;
    display_trajectory_points: number;
    trajectory_window: string;
    nearest_origin_ais_point: string;
    timestamp_nearest_ais_point: string;
    timestamp_nearest_distance_from_origin_km: number;
  };
  attribution: {
    top_vessel: string;
    top_score: number;
    rank: number;
    candidate_count: number;
  };
  vessels: CorrelatedVessel[];
}
