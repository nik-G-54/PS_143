import { apiClient } from './apiClient';
import { BacktrackResponse, VesselsResponse } from '../types/api';
import { mockBacktrackResponse, mockVesselsResponse } from '../mocks/spillMock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

export const spillService = {
  async getSpills(): Promise<any> {
    if (USE_MOCK) return [];
    return apiClient.get('/api/v1/demo/spills');
  },
  
  async getSpill(spillId: string): Promise<any> {
    if (USE_MOCK) return { id: spillId, status: 'UNDER INVESTIGATION' };
    return apiClient.get(`/api/v1/demo/spills/${spillId}`);
  },

  async backtrackSpill(spillId: string): Promise<BacktrackResponse> {
    if (USE_MOCK) return mockBacktrackResponse;
    return apiClient.post(`/api/v1/demo/spills/${spillId}/backtrack`);
  },

  async getSpillVessels(spillId: string): Promise<VesselsResponse> {
    if (USE_MOCK) return mockVesselsResponse;
    return apiClient.get(`/api/v1/demo/spills/${spillId}/vessels`);
  }
};
