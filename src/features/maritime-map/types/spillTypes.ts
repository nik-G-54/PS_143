// Oil spill contracts for the 2D maritime map.
//
// `Raw*` types mirror the backend response byte-for-byte and are only touched by
// `adapters/spillAdapter.ts`. Everything downstream (layers, hooks, UI) consumes
// the normalized `MapSpill` so a backend field rename never reaches the layers.

/** One item of `GET /api/v1/demo/spills`. Every field is optional on purpose —
 *  the adapter validates rather than trusting the payload. */
export interface RawSpillListItem {
  spill_id?: string | null;
  detected_at?: string | null;
  centroid?: { lon?: number | null; lat?: number | null } | null;
  area_km2?: number | null;
  confidence_score?: number | null;
  candidate_count?: number | null;
  image_url?: string | null;
}

/** Paginated envelope of `GET /api/v1/demo/spills`. */
export interface RawSpillListResponse {
  total?: number;
  page?: number;
  page_size?: number;
  items?: RawSpillListItem[];
}

/** A detected oil spill, normalized for rendering.
 *
 *  `areaKm2` and `confidenceScore` stay nullable: the backend contract permits
 *  null, and a missing measurement must render as "unknown" rather than as 0. */
export interface MapSpill {
  spillId: string;
  /** Original ISO-8601 detection timestamp, kept verbatim for display. */
  detectedAt: string;
  /** Epoch ms parsed from `detectedAt`, or null when unparseable. Used for sorting. */
  detectedAtMs: number | null;
  longitude: number;
  latitude: number;
  areaKm2: number | null;
  /** Detection confidence in 0..1. This scores the *oil detection*, never vessel guilt. */
  confidenceScore: number | null;
  /** Number of candidate vessels the backend found for this spill. */
  candidateCount: number | null;
  /** Satellite observation image, already a fully-qualified URL. */
  imageUrl: string | null;
}

/** Geographic bounding box in degrees. */
export interface GeoBounds {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}
