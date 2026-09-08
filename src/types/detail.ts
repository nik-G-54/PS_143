// src/types/detail.ts
export interface SpillDetail {
  spill_id: string;
  source_type: string;
  detected_at: string;
  estimated_age_hours: number;
  estimated_release_time: string;
  observation_latitude: number;
  observation_longitude: number;
  centroid: { lon: number; lat: number };
  polygon: number[][];
  area_km2: number;
  confidence_score: number;
  image_url: string;
  estimated_source_latitude: number;
  estimated_source_longitude: number;
  estimated_source_radius_km: number;
  candidate_count: number;
  ranked_top_vessel: string | null;
  ranked_top_score: number | null;
  runtime_seconds: number;
}

export interface VesselCandidate {
  vessel_id: string;
  is_mock: boolean;
  rank: number;
  score: number | null;
  vessel_name: string | null;
  mmsi: string | null;
  imo: string | null;
  distance_to_origin_km: number | null;
}

export interface VisualizationData {
  spill: {
    spill_id: string;
    latitude: number;
    longitude: number;
    detected_at: string;
  };
  source_estimate: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
  environment: {
    wind: { u: number; v: number; speed: number; direction: number; unit: string };
    current: { u: number; v: number; speed: number; direction: number; unit: string };
  };
  trajectory: Array<{
    timestamp: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface TrajectoryData {
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
    [key: string]: any;
  };
}
