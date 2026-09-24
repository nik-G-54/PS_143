export interface DetectionRegion {
  id: string; // e.g. "SPILL 01"
  confidence: number; // 0 to 1 (e.g. 0.92 = 92%)
  area_km2: number; // e.g. 5.20
  estimated_age_hours?: number | null; // e.g. 33.0
  detected_at?: string;
  centroid?: { lat: number; lon: number } | null;
  polygon?: Array<[number, number]>;
}

export interface MLPredictionResponse {
  is_oil_spill: boolean;
  peak_confidence: number; // 0 to 1 (e.g. 0.92)
  total_spills: number;
  total_area_km2: number;
  age_range?: { min: number; max: number } | null;
  detections: DetectionRegion[];
  filename?: string;
  detected_at?: string;
  message?: string;
  inference_time_ms?: number;
}

export type UIState = 'idle' | 'selected' | 'uploading' | 'scanning' | 'result' | 'error';

export interface AnalysisResult {
  id: string;
  prediction: MLPredictionResponse;
  image_url: string;
  file_name: string;
  file_size_formatted: string;
  dimensions_formatted?: string;
  analyzed_at: string;
}

export interface ScanHistoryItem {
  id: string;
  is_oil_spill: boolean;
  peak_confidence: number;
  total_spills: number;
  total_area_km2: number;
  thumbnail_url: string;
  file_name: string;
  analyzed_at: string;
  full_result: AnalysisResult;
}
