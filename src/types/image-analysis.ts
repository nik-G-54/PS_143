export interface CornerCoordinates {
  topLeft: { lat: number; lon: number };
  topRight: { lat: number; lon: number };
  bottomLeft: { lat: number; lon: number };
  bottomRight: { lat: number; lon: number };
}

export interface ImageMetadata {
  corners: CornerCoordinates;
  capturedAt: string; // ISO-8601
}

export type AnalysisStatus = 'idle' | 'uploading' | 'scanning' | 'result' | 'error';

export interface MLPredictionResponse {
  is_oil_spill: boolean;
  confidence_score: number;
  area_km2?: number | null;
  estimated_age_hours?: number | null;
  centroid?: { lat: number; lon: number } | null;
  spill_id?: string | null;
  message?: string;
}

export interface AnalysisResult {
  id: string;
  prediction: MLPredictionResponse;
  image_url: string;
  analyzed_at: string;
}

export interface ScanHistoryItem {
  id: string;
  is_oil_spill: boolean;
  confidence: number;
  area_km2?: number | null;
  thumbnail_url: string;
  analyzed_at: string;
}
