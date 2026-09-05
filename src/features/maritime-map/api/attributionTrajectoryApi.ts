import { apiClient } from '../../../services/apiClient';
import type { RawAttributionTrajectoryResponse } from '../types/attributionTypes';

/**
 * Fetch ranked vessel attribution + vessel trajectories for the selected spill.
 *
 * Endpoint: `GET /api/v1/demo/spills/{spill_id}/attribution/trajectory`
 * Single source of truth for MAP-07 vessel attribution and historical trajectories.
 */
export function getAttributionTrajectory(
  spillId: string,
  signal?: AbortSignal
): Promise<RawAttributionTrajectoryResponse> {
  return apiClient.get<RawAttributionTrajectoryResponse>(
    `/api/v1/demo/spills/${encodeURIComponent(spillId)}/attribution/trajectory`,
    signal
  );
}

/** Backward-compatible alias for existing imports */
export const fetchSpillAttribution = getAttributionTrajectory;
