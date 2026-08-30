// src/data/mockMapData.ts

import type { 
  SpillEvent, 
  HindcastResult, 
  AttributionResult, 
  VesselTrajectory, 
  EnvironmentData,
  JobStatus
} from '../types/map';

// === 3 MEDITERRANEAN SPILLS ===
export const MOCK_SPILLS: SpillEvent[] = [
  {
    spill_id: "DARTIS-2019-001",
    status: "attributed",
    timestamp: "2019-07-15T12:00:00Z",
    centroid: { latitude: 33.5, longitude: 34.0 },
    polygon: {
      type: "Polygon",
      coordinates: [[[34.0, 33.5], [34.02, 33.5], [34.02, 33.52], [34.0, 33.52], [34.0, 33.5]]]
    },
    detection_confidence: 0.94,
    source_dataset: "DARTIS"
  },
  {
    spill_id: "DARTIS-2019-002",
    status: "processing",
    timestamp: "2019-07-18T08:30:00Z",
    centroid: { latitude: 35.8, longitude: 14.5 },
    polygon: {
      type: "Polygon",
      coordinates: [[[14.5, 35.8], [14.53, 35.8], [14.53, 35.83], [14.5, 35.83], [14.5, 35.8]]]
    },
    detection_confidence: 0.87,
    source_dataset: "Sentinel-1"
  },
  {
    spill_id: "DARTIS-2019-003",
    status: "detected",
    timestamp: "2019-07-20T15:00:00Z",
    centroid: { latitude: 36.2, longitude: 5.5 },
    polygon: {
      type: "Polygon",
      coordinates: [[[5.5, 36.2], [5.52, 36.2], [5.52, 36.22], [5.5, 36.22], [5.5, 36.2]]]
    },
    detection_confidence: 0.72,
    source_dataset: "DARTIS"
  }
];

// === ATTRIBUTION FOR SPILL 1 (FULLY ATTRIBUTED) ===
export const MOCK_ATTRIBUTION: AttributionResult = {
  spill_id: "DARTIS-2019-001",
  status: "completed",
  ranked_vessels: [
    {
      rank: 1,
      vessel_id: "SYNTH-000011",
      vessel_type: "Tanker",
      score: 0.798,
      min_distance_km: 0.0,
      time_difference_minutes: 49.3,
      loiter_minutes: 30.3,
      approach_score: 1.0,
      departure_score: 1.0,
      explanation: [
        "Reached the spill area",
        "Slowed before/around the event",
        "Loitered near the source area",
        "Departed after the event"
      ]
    },
    {
      rank: 2,
      vessel_id: "SYNTH-000023",
      vessel_type: "Bulk Carrier",
      score: 0.412,
      min_distance_km: 2.3,
      time_difference_minutes: 120.0,
      loiter_minutes: 5.0,
      approach_score: 0.6,
      departure_score: 0.4,
      explanation: [
        "Was near the source region",
        "Did not slow down significantly",
        "Left before the event time"
      ]
    }
  ]
};

// === VESSEL TRAJECTORIES ===
export const MOCK_TRAJECTORIES: Record<string, VesselTrajectory> = {
  "SYNTH-000011": {
    vessel_id: "SYNTH-000011",
    vessel_type: "Tanker",
    points: [
      { timestamp: "2019-07-15T10:00:00Z", latitude: 33.2, longitude: 34.5, speed: 12.5, course: 220 },
      { timestamp: "2019-07-15T11:00:00Z", latitude: 33.35, longitude: 34.25, speed: 8.2, course: 210 },
      { timestamp: "2019-07-15T11:30:00Z", latitude: 33.50, longitude: 34.00, speed: 1.2, course: 180 },
      { timestamp: "2019-07-15T12:00:00Z", latitude: 33.50, longitude: 34.00, speed: 0.8, course: 180 },
      { timestamp: "2019-07-15T12:30:00Z", latitude: 33.51, longitude: 34.01, speed: 1.4, course: 220 },
      { timestamp: "2019-07-15T13:30:00Z", latitude: 33.65, longitude: 33.88, speed: 7.9, course: 220 },
      { timestamp: "2019-07-15T15:00:00Z", latitude: 33.9, longitude: 33.5, speed: 13.1, course: 215 }
    ]
  },
  "SYNTH-000023": {
    vessel_id: "SYNTH-000023",
    vessel_type: "Bulk Carrier",
    points: [
      { timestamp: "2019-07-15T10:00:00Z", latitude: 33.0, longitude: 35.0, speed: 14.0, course: 260 },
      { timestamp: "2019-07-15T11:30:00Z", latitude: 33.4, longitude: 34.8, speed: 13.8, course: 255 },
      { timestamp: "2019-07-15T13:00:00Z", latitude: 33.8, longitude: 34.5, speed: 14.2, course: 250 },
      { timestamp: "2019-07-15T15:00:00Z", latitude: 34.2, longitude: 34.1, speed: 14.0, course: 248 }
    ]
  },
  "SYNTH-CLUSTER-1": {
    vessel_id: "SYNTH-CLUSTER-1",
    vessel_type: "Cargo Vessel",
    points: [
      { timestamp: "2019-07-15T12:00:00Z", latitude: 33.52, longitude: 34.02, speed: 5.4, course: 45 }
    ]
  },
  "SYNTH-CLUSTER-2": {
    vessel_id: "SYNTH-CLUSTER-2",
    vessel_type: "Fishing Vessel",
    points: [
      { timestamp: "2019-07-15T12:00:00Z", latitude: 33.48, longitude: 34.03, speed: 2.1, course: 120 }
    ]
  },
  "SYNTH-CLUSTER-3": {
    vessel_id: "SYNTH-CLUSTER-3",
    vessel_type: "Passenger Ship",
    points: [
      { timestamp: "2019-07-15T12:00:00Z", latitude: 33.51, longitude: 33.97, speed: 8.7, course: 290 }
    ]
  },
  "SYNTH-CLUSTER-4": {
    vessel_id: "SYNTH-CLUSTER-4",
    vessel_type: "Tugboat",
    points: [
      { timestamp: "2019-07-15T12:00:00Z", latitude: 33.49, longitude: 33.98, speed: 0.5, course: 180 }
    ]
  }
};

// === HINDCAST RESULT ===
export const MOCK_HINDCAST: HindcastResult = {
  spill_id: "DARTIS-2019-001",
  model: "surface_advection_v1",
  source_region: {
    type: "Polygon",
    coordinates: [[[33.7, 33.6], [33.9, 33.6], [33.9, 33.8], [33.7, 33.8], [33.7, 33.6]]]
  },
  particles: [
    { timestamp: "2019-07-15T11:30:00Z", latitude: 33.49, longitude: 34.01 },
    { timestamp: "2019-07-15T11:00:00Z", latitude: 33.52, longitude: 34.05 },
    { timestamp: "2019-07-15T10:30:00Z", latitude: 33.55, longitude: 34.10 },
    { timestamp: "2019-07-15T10:00:00Z", latitude: 33.58, longitude: 34.15 },
    { timestamp: "2019-07-15T09:30:00Z", latitude: 33.62, longitude: 34.22 },
    { timestamp: "2019-07-15T09:00:00Z", latitude: 33.65, longitude: 34.30 }
  ],
  uncertainty: { radius_km: 5.8, method: "ensemble" }
};

// === ENVIRONMENT DATA ===
export const MOCK_ENVIRONMENT: EnvironmentData = {
  timestamp: "2019-07-15T12:00:00Z",
  location: { latitude: 33.5, longitude: 34.0 },
  wind: { u10_mps: 6.393, v10_mps: 1.348, speed_mps: 6.533, direction_deg: 258.1 },
  current: { uo_mps: 0.0216, vo_mps: -0.0899, speed_mps: 0.0925, direction_deg: 166.5 },
  sources: { wind: "ERA5", current: "CMEMS MEDSEA" }
};

// === PROCESSING MOCK DATA FOR OTHER SPILLS (DYNAMIC SIMULATION) ===
export const MOCK_JOBS: Record<string, JobStatus> = {
  "DARTIS-2019-002": {
    job_id: "JOB-2019-002",
    status: "running",
    stage: "Simulating surface drift particle tracks (hindcast)",
    progress: 45,
    message: "Integrating CMEMS ocean current fields & ERA5 wind forcing...",
    updated_at: "2019-07-18T08:32:15Z"
  },
  "DARTIS-2019-003": {
    job_id: "JOB-2019-003",
    status: "queued",
    stage: "Waiting in queue...",
    progress: 0,
    message: "Job queued. Waiting for system resources...",
    updated_at: "2019-07-20T15:01:00Z"
  }
};
