import { apiClient } from './apiClient';
import { BacktrackResponse, VesselsResponse } from '../types/api';
import { MOCK_SPILL_LIST, MOCK_SCENARIOS } from '../mocks/spillsData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

// Delay function to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const spillService = {
  async getSpills(page: number = 1, pageSize: number = 20): Promise<any> {
    if (USE_MOCK) {
      await delay(500);
      return {
        total: MOCK_SPILL_LIST.length,
        page: 1,
        page_size: MOCK_SPILL_LIST.length,
        items: MOCK_SPILL_LIST
      };
    }
    return apiClient.get(`/api/v1/demo/spills?page=${page}&page_size=${pageSize}`);
  },
  
  async getSpill(spillId: string): Promise<any> {
    if (USE_MOCK) {
      await delay(500);
      if (spillId === 'spill_F') throw new Error('Simulated API Failure: HTTP 500');
      const spill = MOCK_SPILL_LIST.find(s => s.spill_id === spillId);
      return spill || MOCK_SPILL_LIST[0]; // fallback to first if unknown
    }
    return apiClient.get(`/api/v1/demo/spills/${spillId}`);
  },

  async backtrackSpill(spillId: string): Promise<BacktrackResponse> {
    if (USE_MOCK) {
      await delay(600);
      if (spillId === 'spill_F') throw new Error('Simulated API Failure: HTTP 500');
      const scenario = MOCK_SCENARIOS[spillId];
      if (scenario) return scenario.backtrack;
      // Default fallback to Scenario A
      return MOCK_SCENARIOS['spill_A'].backtrack;
    }
    return apiClient.post(`/api/v1/demo/spills/${spillId}/backtrack`);
  },

  async getSpillVessels(spillId: string): Promise<VesselsResponse> {
    if (USE_MOCK) {
      await delay(600);
      if (spillId === 'spill_F') throw new Error('Simulated API Failure: HTTP 500');
      const scenario = MOCK_SCENARIOS[spillId];
      if (scenario) return scenario.vessels;
      // Default fallback to Scenario A
      return MOCK_SCENARIOS['spill_A'].vessels;
    }
    return apiClient.get(`/api/v1/demo/spills/${spillId}/vessels`);
  },

  async getVisualization(spillId: string): Promise<any> {
    if (USE_MOCK) {
      await delay(400);
      return null; // Mock doesn't have visualization data currently, we fallback to demo generator
    }
    return apiClient.get(`/api/v1/visualization/spills/${spillId}`);
  }
};
