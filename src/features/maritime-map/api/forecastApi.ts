import { apiClient } from '../../../services/apiClient';
import { sharedRequest } from '../../../services/sharedRequest';
import type { RawPredictResponse } from '../types/forecastTypes';

/**
 * Fetch the forward drift forecast bundle for one spill. Shared (see
 * sharedRequest.ts): the forecast layer, the evidence dossier and the report's
 * background preparation all reuse one request per spill. `_signal` is kept
 * for call-site compatibility; a shared request isn't cancelled by one caller.
 */
export function fetchSpillForecast(
  spillId: string,
  _signal?: AbortSignal
): Promise<RawPredictResponse> {
  const path = `/api/v1/demo/spills/${encodeURIComponent(spillId)}/predict`;
  return sharedRequest(`GET ${path}`, () => apiClient.get<RawPredictResponse>(path));
}
