// src/types/map.ts

// === SPILL EVENT (GET /api/v1/spills/{spill_id}) ===
export interface SpillEvent {
  spill_id: string;
  status: 'detected' | 'processing' | 'attributed';
  timestamp: string; // ISO-8601
  centroid: {
    latitude: number;
    longitude: number;
  };
  polygon: {
    type: 'Polygon';
    coordinates: number[][][]; // GeoJSON format
  };
  detection_confidence: number; // 0-1
  source_dataset: string;
}

// === ENVIRONMENT (GET /api/v1/spills/{spill_id}/environment) ===
export interface EnvironmentData {
  timestamp: string;
  location: { latitude: number; longitude: number };
  wind: {
    u10_mps: number;
    v10_mps: number;
    speed_mps: number;
    direction_deg: number;
  };
  current: {
    uo_mps: number;
    vo_mps: number;
    speed_mps: number;
    direction_deg: number;
  };
  sources: { wind: string; current: string };
}

// === HINDCAST (POST /api/v1/hindcast) ===
export interface HindcastResult {
  spill_id: string;
  model: string;
  source_region: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  particles: Array<{
    timestamp: string;
    latitude: number;
    longitude: number;
  }>;
  uncertainty: {
    radius_km: number;
    method: string;
  };
}

// === AIS CANDIDATES (GET /api/v1/ais/candidates) ===
export interface AISCandidate {
  vessel_id: string;
  vessel_type: string;
  observations: Array<{
    timestamp: string;
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    heading: number;
  }>;
}

// === ATTRIBUTION (GET /api/v1/attribution/{spill_id}) ===
export interface AttributionResult {
  spill_id: string;
  status: 'running' | 'completed';
  ranked_vessels: Array<{
    rank: number;
    vessel_id: string;
    score: number;
    vessel_type: string;
    min_distance_km: number;
    time_difference_minutes: number;
    loiter_minutes: number;
    approach_score: number;
    departure_score: number;
    explanation: string[];
  }>;
}

// === VESSEL TRAJECTORY (GET /api/v1/vessels/{id}/trajectory) ===
export interface VesselTrajectory {
  vessel_id: string;
  vessel_type: string;
  points: Array<{
    timestamp: string;
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
  }>;
}

// === JOB STATUS (GET /api/v1/jobs/{job_id}) ===
export interface JobStatus {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  stage: string;
  progress: number; // 0-100
  message: string;
  updated_at: string;
}

// === WIND/CURRENT ARROW (derived from EnvironmentData) ===
export interface WindArrow {
  longitude: number;
  latitude: number;
  angle: number; // degrees
  speed: number;
  type: 'wind' | 'current';
}
