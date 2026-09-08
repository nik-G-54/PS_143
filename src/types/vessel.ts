// src/types/vessel.ts
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

export interface TrajectoryPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
}

export interface AttributionTrajectory {
  spill_id: string;
  backtrack_origin: {
    latitude: number;
    longitude: number;
    timestamp: string;
    radius_km: number;
  };
  verification?: {
    culprit_vessel_id: string;
    culprit_position_timestamp: string;
    origin_to_culprit_distance_km: number;
    within_backtrack_radius: boolean;
  };
}

export interface VesselTrack {
  vesselId: string;
  path: [number, number, number][]; // [lng, lat, timestamp]
  color: [number, number, number];
  name: string;
  rank: number;
}
