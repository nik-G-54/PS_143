import type { MLPredictionResponse } from '../types/image-analysis';

export type MockScenario =
  | 'highConfidenceSpill'
  | 'mediumConfidenceSpill'
  | 'lowConfidenceSpill'
  | 'noSpillClean'
  | 'noSpillCloud'
  | 'noSpillLand';

export const MOCK_RESPONSES: Record<MockScenario, MLPredictionResponse> = {
  highConfidenceSpill: {
    is_oil_spill: true,
    confidence_score: 0.94,
    area_km2: 3.82,
    estimated_age_hours: 8.2,
    centroid: { lat: 35.0494, lon: 24.0517 },
    spill_id: 'mock_high_001',
  },
  mediumConfidenceSpill: {
    is_oil_spill: true,
    confidence_score: 0.72,
    area_km2: 1.15,
    estimated_age_hours: 22.7,
    centroid: { lat: 35.0288, lon: 24.0288 },
    spill_id: 'mock_med_001',
  },
  lowConfidenceSpill: {
    is_oil_spill: true,
    confidence_score: 0.56,
    area_km2: 0.43,
    estimated_age_hours: 30.1,
    centroid: { lat: 35.061, lon: 24.0426 },
    spill_id: 'mock_low_001',
  },
  noSpillClean: {
    is_oil_spill: false,
    confidence_score: 0.08,
    area_km2: null,
    estimated_age_hours: null,
    centroid: null,
    spill_id: null,
  },
  noSpillCloud: {
    is_oil_spill: false,
    confidence_score: 0.31,
    area_km2: null,
    estimated_age_hours: null,
    centroid: null,
    spill_id: null,
  },
  noSpillLand: {
    is_oil_spill: false,
    confidence_score: 0.04,
    area_km2: null,
    estimated_age_hours: null,
    centroid: null,
    spill_id: null,
  },
};

export const RANDOM_POOL: MockScenario[] = [
  'highConfidenceSpill',
  'mediumConfidenceSpill',
  'lowConfidenceSpill',
  'noSpillClean',
  'noSpillCloud',
  'noSpillLand',
];

export function getMockResponse(): MLPredictionResponse {
  const pick = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
  return { ...MOCK_RESPONSES[pick] };
}
