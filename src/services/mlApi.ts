import type { ImageMetadata, MLPredictionResponse } from '../types/image-analysis';
import { getMockResponse } from '../data/mockPredictions';

// ============================================================
// 🎛️ THE ONLY SWITCH YOU NEED FOR REAL API VS MOCK DATA
// Set to true for local UI testing without hitting backend API
// Set to false when backend API is online and ready
// ============================================================
export const USE_MOCK = true;
// ============================================================

/**
 * Formats a date string to strict 'YYYY-MM-DDTHH:MM:SSZ' without milliseconds
 * to satisfy ML server validation requirements.
 */
function formatCaptureTime(dateInput?: string): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) {
      return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  } catch {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
}

export async function analyzeImage(
  file: File,
  metadata: ImageMetadata
): Promise<MLPredictionResponse> {
  // Step 1: Input Validation
  try {
    if (!file) {
      throw new Error('[API Validation Error] No image file provided for analysis.');
    }
    if (!metadata || !metadata.corners) {
      throw new Error('[API Validation Error] Image metadata corners are missing or invalid.');
    }
  } catch (err) {
    console.error('[mlApi] Validation failed:', err);
    throw err;
  }

  // If USE_MOCK is true, return mock response directly without making network requests
  if (USE_MOCK) {
    console.log('[mlApi] USE_MOCK is active. Returning mock prediction payload.');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getMockResponse();
  }

  // Step 2: FormData Construction (For Real API)
  let formData: FormData;
  try {
    formData = new FormData();

    // Image file
    formData.append('file', file);
    formData.append('image', file);

    // Exact required FastAPI model field names:
    // Upper-left (top-left) lat/lon
    formData.append('ul_lat', String(metadata.corners.topLeft.lat ?? 0));
    formData.append('ul_lon', String(metadata.corners.topLeft.lon ?? 0));

    // Upper-right (top-right) lat/lon
    formData.append('ur_lat', String(metadata.corners.topRight.lat ?? 0));
    formData.append('ur_lon', String(metadata.corners.topRight.lon ?? 0));

    // Bottom-left lat/lon
    formData.append('bl_lat', String(metadata.corners.bottomLeft.lat ?? 0));
    formData.append('bl_lon', String(metadata.corners.bottomLeft.lon ?? 0));

    // Bottom-right lat/lon
    formData.append('br_lat', String(metadata.corners.bottomRight.lat ?? 0));
    formData.append('br_lon', String(metadata.corners.bottomRight.lon ?? 0));

    // Capture time formatted strictly as 'YYYY-MM-DDTHH:MM:SSZ'
    const captureTimeFormatted = formatCaptureTime(metadata.capturedAt);
    formData.append('capture_time', captureTimeFormatted);

    // Additional backward-compatibility aliases
    formData.append('top_left_lat', String(metadata.corners.topLeft.lat ?? 0));
    formData.append('top_left_lon', String(metadata.corners.topLeft.lon ?? 0));
    formData.append('top_right_lat', String(metadata.corners.topRight.lat ?? 0));
    formData.append('top_right_lon', String(metadata.corners.topRight.lon ?? 0));
    formData.append('bottom_left_lat', String(metadata.corners.bottomLeft.lat ?? 0));
    formData.append('bottom_left_lon', String(metadata.corners.bottomLeft.lon ?? 0));
    formData.append('bottom_right_lat', String(metadata.corners.bottomRight.lat ?? 0));
    formData.append('bottom_right_lon', String(metadata.corners.bottomRight.lon ?? 0));
    formData.append('datetime', captureTimeFormatted);

  } catch (err) {
    console.error('[mlApi] FormData building failed:', err);
    throw new Error(`[Form Error] Failed to prepare upload payload: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Step 3: API Request Dispatch
  let response: Response;
  try {
    response = await fetch('/predict', {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('[mlApi] Network request failed:', err);
    throw new Error(`[Network Error] Could not connect to ML Server (/predict). Please check connection or CORS settings.`);
  }

  // Step 4: Handle Non-OK HTTP Status (including 422 Unprocessable Entity)
  if (!response.ok) {
    let errorDetail = `Server returned status ${response.status} (${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson) {
        if (errJson.detail) {
          if (typeof errJson.detail === 'string') {
            errorDetail = errJson.detail;
          } else if (Array.isArray(errJson.detail)) {
            errorDetail = errJson.detail
              .map((d: any) => {
                const locStr = Array.isArray(d?.loc) ? d.loc.join('.') : String(d?.loc || '');
                const msg = d?.msg || 'invalid parameter';
                return `${locStr}: ${msg}`;
              })
              .join(' | ');
          } else {
            errorDetail = JSON.stringify(errJson.detail);
          }
        } else if (errJson.message || errJson.error) {
          errorDetail = errJson.message || errJson.error;
        }
      }
    } catch (parseErr) {
      console.warn('[mlApi] Could not parse server error JSON response:', parseErr);
    }

    console.error(`[mlApi] HTTP Error ${response.status}:`, errorDetail);
    throw new Error(`[Server Error ${response.status}] ${errorDetail}`);
  }

  // Step 5: Response JSON Parsing & Validation
  try {
    const data = await response.json();
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid JSON payload returned from backend.');
    }
    return data as MLPredictionResponse;
  } catch (err) {
    console.error('[mlApi] Response parsing failed:', err);
    throw new Error(`[Parsing Error] Failed to parse backend prediction response: ${err instanceof Error ? err.message : String(err)}`);
  }
}
