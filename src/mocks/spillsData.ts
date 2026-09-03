import { BacktrackResponse, VesselsResponse } from '../types/api';

// Create 97 lightweight spill records
export const MOCK_SPILL_LIST = Array.from({ length: 97 }, (_, i) => ({
  spill_id: i === 0 ? 'spill_A' : i === 1 ? 'spill_B' : i === 2 ? 'spill_C' : i === 3 ? 'spill_D' : i === 4 ? 'spill_E' : `spill_${i + 5}`,
  detected_at: new Date(Date.now() - i * 86400000).toISOString(),
  centroid: { latitude: 35.0494 + (Math.random() - 0.5), longitude: 24.0517 + (Math.random() - 0.5) },
  area_km2: parseFloat((Math.random() * 5 + 0.1).toFixed(2)),
  confidence_score: Math.floor(Math.random() * 20 + 80),
  candidate_count: i < 5 ? (i === 2 ? 3 : 1) : Math.floor(Math.random() * 5),
  status: 'UNDER INVESTIGATION',
  location_name: 'Mediterranean Sea'
}));

// SYNTHETIC FRONTEND TEST TRAJECTORY
const syntheticTrajectory = [
  { timestamp: '2019-01-12T11:18:35+00:00', latitude: 35.0292, longitude: 24.0945 },
  { timestamp: '2019-01-12T18:00:00+00:00', latitude: 35.0350, longitude: 24.0800 },
  { timestamp: '2019-01-13T00:00:00+00:00', latitude: 35.0420, longitude: 24.0650 },
  { timestamp: '2019-01-13T03:42:35+00:00', latitude: 35.0494, longitude: 24.0517 }
];

// SYNTHETIC FRONTEND TEST AIS TRACK
const syntheticAISTrack = [
  { timestamp: '2019-01-12T10:00:00+00:00', latitude: 35.0200, longitude: 24.1100, heading: 310 },
  { timestamp: '2019-01-12T11:18:35+00:00', latitude: 35.0292, longitude: 24.0945, heading: 305 }, // Source
  { timestamp: '2019-01-12T14:00:00+00:00', latitude: 35.0450, longitude: 24.0700, heading: 300 },
  { timestamp: '2019-01-13T03:42:35+00:00', latitude: 35.0800, longitude: 24.0200, heading: 295 }
];

const baseBacktrack = {
  observation: {
    latitude: 35.0494,
    longitude: 24.0517,
    timestamp: '2019-01-13T03:42:35+00:00'
  },
  estimated_release_time: '2019-01-12T11:18:35+00:00',
  source_estimate: {
    latitude: 35.0292,
    longitude: 24.0945,
    radius_km: 0.55
  }
};

export const MOCK_SCENARIOS: Record<string, { backtrack: BacktrackResponse, vessels: VesselsResponse }> = {
  // SCENARIO A: Complete happy path
  spill_A: {
    backtrack: {
      spill_id: 'spill_A',
      backtrack: { ...baseBacktrack, trajectory: syntheticTrajectory },
      attribution: { candidate_count: 1, top_vessel: 'VESSEL_A', top_score: 0.95 }
    },
    vessels: {
      spill_id: 'spill_A',
      candidate_count: 1,
      vessels: [{
        vessel_id: 'VESSEL_A',
        rank: 1,
        score: 0.95,
        vessel_name: 'SYNTHETIC ALPHA',
        distance_to_origin_km: 0.1,
        track: syntheticAISTrack
      }]
    }
  },
  // SCENARIO B: No trajectory
  spill_B: {
    backtrack: {
      spill_id: 'spill_B',
      backtrack: { ...baseBacktrack },
      attribution: { candidate_count: 1, top_vessel: 'VESSEL_B', top_score: 0.88 }
    },
    vessels: {
      spill_id: 'spill_B',
      candidate_count: 1,
      vessels: [{
        vessel_id: 'VESSEL_B',
        rank: 1,
        score: 0.88,
        vessel_name: 'SYNTHETIC BETA',
        distance_to_origin_km: 0.5,
        track: syntheticAISTrack
      }]
    }
  },
  // SCENARIO C: Multiple candidate vessels
  spill_C: {
    backtrack: {
      spill_id: 'spill_C',
      backtrack: { ...baseBacktrack, trajectory: syntheticTrajectory },
      attribution: { candidate_count: 3, top_vessel: 'VESSEL_C1', top_score: 0.92 }
    },
    vessels: {
      spill_id: 'spill_C',
      candidate_count: 3,
      vessels: [
        { vessel_id: 'VESSEL_C1', rank: 1, score: 0.92, vessel_name: 'SYNTHETIC GAMMA 1', distance_to_origin_km: 0.2, track: syntheticAISTrack },
        { vessel_id: 'VESSEL_C2', rank: 2, score: 0.75, vessel_name: 'SYNTHETIC GAMMA 2', distance_to_origin_km: 1.5, track: syntheticAISTrack.map(t => ({...t, latitude: t.latitude + 0.05})) },
        { vessel_id: 'VESSEL_C3', rank: 3, score: 0.40, vessel_name: 'SYNTHETIC GAMMA 3', distance_to_origin_km: 3.0 }
      ]
    }
  },
  // SCENARIO D: Candidate with null score
  spill_D: {
    backtrack: {
      spill_id: 'spill_D',
      backtrack: { ...baseBacktrack, trajectory: syntheticTrajectory },
      attribution: { candidate_count: 1, top_vessel: 'VESSEL_D', top_score: null }
    },
    vessels: {
      spill_id: 'spill_D',
      candidate_count: 1,
      vessels: [{
        vessel_id: 'VESSEL_D',
        rank: 1,
        score: null,
        vessel_name: 'SYNTHETIC DELTA',
        distance_to_origin_km: 0.8,
        track: syntheticAISTrack
      }]
    }
  },
  // SCENARIO E: Candidate without AIS track
  spill_E: {
    backtrack: {
      spill_id: 'spill_E',
      backtrack: { ...baseBacktrack, trajectory: syntheticTrajectory },
      attribution: { candidate_count: 1, top_vessel: 'VESSEL_E', top_score: 0.85 }
    },
    vessels: {
      spill_id: 'spill_E',
      candidate_count: 1,
      vessels: [{
        vessel_id: 'VESSEL_E',
        rank: 1,
        score: 0.85,
        vessel_name: 'SYNTHETIC EPSILON',
        distance_to_origin_km: 0.6
        // No track provided
      }]
    }
  }
};