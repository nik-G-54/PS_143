import { apiClient } from '../../../services/apiClient';
import type { RawPredictResponse } from '../types/forecastTypes';

/**
 * Fetch the forward drift forecast bundle for one spill.
 */
export function fetchSpillForecast(
  spillId: string,
  signal?: AbortSignal
): Promise<RawPredictResponse> {
  return apiClient.get<RawPredictResponse>(
    `/api/v1/demo/spills/${encodeURIComponent(spillId)}/predict`,
    signal
  );
}
