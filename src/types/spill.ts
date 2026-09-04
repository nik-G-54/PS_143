// src/types/spill.ts

export interface Centroid {
  lon: number;
  lat: number;
}

export interface SpillItemRaw {
  spill_id: string;
  detected_at: string;
  centroid?: Centroid | null;
  area_km2?: number | null;
  confidence_score?: number | null;
  candidate_count?: number | null;
  image_url?: string | null;
}

export interface SpillPageResponse {
  total: number;
  page: number;
  page_size: number;
  items: SpillItemRaw[];
}

export interface SpillDetailRaw {
  spill_id: string;
  source_type?: string | null;
  detected_at: string;
  estimated_age_hours?: number | null;
  area_km2?: number | null;
  confidence_score?: number | null;
  image_url?: string | null;
  candidate_count?: number | null;
  ranked_top_vessel?: string | null;
}

export interface TrajectoryPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
}

export interface VectorComponent {
  u: number;
  v: number;
  speed: number;
  direction: number;
  unit: string;
}

export interface EnvironmentData {
  wind?: VectorComponent | null;
  current?: VectorComponent | null;
}

export interface SourceEstimate {
  latitude: number;
  longitude: number;
  radius_km: number;
}

export interface VisualizationResponse {
  spill: {
    spill_id: string;
    latitude: number;
    longitude: number;
    detected_at: string;
  };
  source_estimate?: SourceEstimate | null;
  environment?: EnvironmentData | null;
  trajectory: TrajectoryPoint[];
}

export interface FullVisualizationData {
  spillId: string;
  detectedAt: Date;
  latitude: number;
  longitude: number;
  area: number;
  confidence: number;
  imageUrl: string | null;
  candidateCount: number;
  rankedTopVessel: string | null;
  estimatedAgeHours: number | null;
  sourceType: string | null;
  sourceEstimate: SourceEstimate | null;
  environment: EnvironmentData | null;
  trajectory: TrajectoryPoint[];
}

export interface NormalizedSpill {
  id: string;
  detectedAt: Date;
  area: number;
  confidence: number;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  candidateCount: number;
}

export interface DashboardFilters {
  dateRange: { start: Date; end: Date } | null;
  selectedDate: Date | null;
  confidenceRange: { min: number; max: number } | null;
  areaRange: { min: number; max: number } | null;
  selectedSizeBucket: string | null;
}

export interface TrendPoint {
  dateStr: string;
  displayDate: string;
  date: Date;
  count: number;
  totalArea: number;
  avgConfidence: number;
}

export interface SizeBucket {
  key: string;
  label: string;
  minArea: number;
  maxArea: number;
  count: number;
}

export interface ConfidenceBucket {
  key: string;
  label: string;
  minConfidence: number;
  maxConfidence: number;
  count: number;
}

export interface HeatmapCell {
  dateKey: string;
  displayDate: string;
  date: Date;
  count: number;
  monthIndex: number;
  dayOfWeek: number;
}
