// Loads the world wind + ocean-current grid for the click-toggled particle
// overlay from our own same-origin `public/ocean-flow-data.json` — a static
// file regenerated offline by `scripts/generateOceanFlowData.js` before each
// deploy. No third-party weather API is ever called from the browser; see
// that script for the Open-Meteo fetch this data comes from.

import type { OceanFlowGrids } from '../types/oceanFlowTypes';

/**
 * Fetches the pre-generated wind + current grids once. Grid density is a
 * fixed world box baked in at generation time, not the current viewport, so
 * the fetch only ever needs to happen once per session — see useOceanFlow.ts.
 */
export async function fetchOceanFlowGrids(): Promise<OceanFlowGrids> {
  const response = await fetch('/ocean-flow-data.json');
  if (!response.ok) {
    throw new Error(`Failed to load ocean-flow-data.json (${response.status})`);
  }
  const data = await response.json();
  if (!data?.wind?.points || !data?.current?.points) {
    throw new Error('ocean-flow-data.json is missing wind/current grids.');
  }
  return { wind: data.wind, current: data.current };
}
