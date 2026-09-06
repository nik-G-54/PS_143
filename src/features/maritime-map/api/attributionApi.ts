import { apiClient } from '../../../services/apiClient';
import type { RawAttributionTrajectoryResponse } from '../types/attributionTypes';

/**
 * Fetch ranked vessel attribution with AIS tracks correlated to the oil backtrack.
 */
export function fetchSpillAttribution(
  spillId: string,
  signal?: AbortSignal
): Promise<RawAttributionTrajectoryResponse> {
  return apiClient.get<RawAttributionTrajectoryResponse>(
    `/api/v1/demo/spills/${encodeURIComponent(spillId)}/attribution/trajectory`,
    signal
  );
}
