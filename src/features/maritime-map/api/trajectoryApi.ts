import { apiClient } from '../../../services/apiClient';
import type { RawVisualizationResponse } from '../types/trajectoryTypes';

/**
 * Fetch the drift visualization bundle for one spill: backtracked trajectory,
 * origin estimate and the environment readings at the detection.
 *
 * Responds 404 for an unknown spill id, which surfaces through `apiClient.get` as
 * a rejected promise.
 */
export function fetchSpillVisualization(
  spillId: string,
  signal?: AbortSignal
): Promise<RawVisualizationResponse> {
  return apiClient.get<RawVisualizationResponse>(
    `/api/v1/visualization/spills/${encodeURIComponent(spillId)}`,
    signal
  );
}
