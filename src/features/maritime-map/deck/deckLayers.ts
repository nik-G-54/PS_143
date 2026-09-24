import type { Layer } from '@deck.gl/core';
import { createTrajectoryLayers } from '../layers/TrajectoryLayer';
import type { TrajectoryLayerOptions } from '../layers/TrajectoryLayer';
import { createForecastLayers } from '../layers/ForecastLayer';
import type { ForecastLayerOptions } from '../layers/ForecastLayer';

/** Which drift geometry the investigation is currently showing. */
export type InvestigationMode = 'backtrack' | 'forecast';

export interface DriftLayerContext extends TrajectoryLayerOptions, ForecastLayerOptions {
  /** Defaults to 'backtrack' so every existing caller keeps today's behavior. */
  investigationMode?: InvestigationMode;
}

/**
 * The backtracked trajectory in 'backtrack' mode (the default, unchanged
 * behavior) or the forward forecast in 'forecast' mode — never both at once,
 * so switching modes fully replaces one drift visualization with the other
 * instead of overlaying them.
 *
 * Deliberately kept separate from the spill/vessel/environment layers (see
 * `MaritimeMap.tsx`, which memoizes each independently before combining them
 * for the deck.gl overlay): this is the only piece that depends on camera
 * zoom (the forecast heatmap's kernel radius has no geographic-unit option —
 * see `forecastEncoding.ts`), so a zoom change here must not force the ~377
 * spill markers and vessel tracks to rebuild too. Bundling everything into
 * one composer previously meant every zoom tick rebuilt the entire layer
 * stack, which is what made zooming feel laggy while a forecast was active.
 */
export function buildDriftLayers(context: DriftLayerContext): Layer[] {
  return (
    context.investigationMode === 'forecast'
      ? createForecastLayers(context)
      : createTrajectoryLayers(context)
  ) as Layer[];
}
