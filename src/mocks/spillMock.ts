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
  candidates: [
    { vessel_id: 'SYNTH-Y2019-000144', score: 0.92 }
  ]
};
