// Wind / ocean-current flow field for the click-toggled globe overlay.
//
// Sourced from Open-Meteo (free, keyless) rather than the backend — this is a
// world grid of vectors for the animated particle visualization, unrelated to
// `SpillEnvironment` in trajectoryTypes.ts, which is a single backend-supplied
// vector at one spill's detection point.

/** One grid sample. `u`/`v` are eastward/northward m/s — `null` where the source has no data (current, over land). */
export interface FlowGridPoint {
  longitude: number;
  latitude: number;
  u: number | null;
  v: number | null;
}

/** A regular lon/lat grid of `FlowGridPoint`s, row-major (row 0 = `latMin`). */
export interface FlowGrid {
  cols: number;
  rows: number;
  lonMin: number;
  lonMax: number;
  latMin: number;
  latMax: number;
  points: FlowGridPoint[];
}

export interface OceanFlowGrids {
  wind: FlowGrid;
  current: FlowGrid;
}
