import { BacktrackResponse, VesselsResponse } from '../types/api';

export const mockBacktrackResponse: BacktrackResponse = {
  spill_id: 'spill_dba12b',
  backtrack: {
    observation: {
      latitude: 35.0494,
      longitude: 24.0517,
      timestamp: '2019-01-13T03:42:35+00:00'
    },
    estimated_release_time: '2019-01-12T11:18:35+00:00',
    source_estimate: {
      latitude: 35.02920753859703,
      longitude: 24.094572171576818,
      radius_km: 0.5515652743393171
    }
  },
  attribution: {
    candidate_count: 1,
    top_vessel: 'SYNTH-Y2019-000144',
    top_score: null
  }
};

export const mockVesselsResponse: VesselsResponse = {
  spill_id: 'spill_dba12b',
  candidate_count: 1,
  candidates: [
    {
      vessel_id: 'SYNTH-Y2019-000144',
      is_mock: true,
      rank: 1,
      score: null, // As requested in Phase 10 instructions ("If score is null: display 'Score unavailable'")
      vessel_name: 'SYNTHETIC TANKER',
      mmsi: '123456789',
      imo: '9876543',
      distance_to_origin_km: 0.42
    }
  ]
};
