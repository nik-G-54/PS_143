// Coastline GeoJSON sources for the 2D maritime map.
//
// Each source is a Natural Earth 10m coastline extract, pre-clipped to the
// investigation region's bounding box and checked into `../data/` as
// `coastline-<source>.geojson`. Adding a new region (e.g. India) is: drop the
// clipped file into that folder using that naming, then add the name to
// `CoastlineSource` below — `loadCoastline` picks it up, no other wiring needed.

export type CoastlineSource = 'mediterranean' | 'india';

/**
 * Load and parse the coastline GeoJSON for one region.
 *
 * A dynamic import per call, not an eager glob of every source, so selecting
 * `mediterranean` never pulls `india`'s (or some future region's) file into the
 * browser too — only the region actually in view is fetched.
 *
 * Returns null when that region has no checked-in extract yet (e.g. `india`
 * before its file is added) or the file fails to parse, so a caller can fall
 * back to no coastline layer instead of crashing the map.
 */
export async function loadCoastline(
  source: CoastlineSource
): Promise<GeoJSON.FeatureCollection | null> {
  let raw: string;
  try {
    const module = (await import(`../data/coastline-${source}.geojson?raw`)) as {
      default: string;
    };
    raw = module.default;
  } catch (err) {
    console.warn(`[coastlineConfig] no coastline file checked in for "${source}"`, err);
    return null;
  }

  try {
    return JSON.parse(raw) as GeoJSON.FeatureCollection;
  } catch (err) {
    console.warn(`[coastlineConfig] failed to parse coastline file for "${source}"`, err);
    return null;
  }
}
