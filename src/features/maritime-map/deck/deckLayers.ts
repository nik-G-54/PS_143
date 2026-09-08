import type { Layer } from '@deck.gl/core';
import { createSpillLayers } from '../layers/SpillLayer';
import type { SpillLayerOptions } from '../layers/SpillLayer';
import { createTrajectoryLayers } from '../layers/TrajectoryLayer';
import type { TrajectoryLayerOptions } from '../layers/TrajectoryLayer';
import { createEnvironmentLayers } from '../layers/EnvironmentLayer';
import type { EnvironmentLayerOptions } from '../layers/EnvironmentLayer';
import { createVesselLayers } from '../layers/VesselLayer';
import type { VesselLayerOptions } from '../layers/VesselLayer';

/** Everything the deck.gl overlay needs to render the current map state. */
export interface MaritimeLayerContext
  extends SpillLayerOptions,
    TrajectoryLayerOptions,
    EnvironmentLayerOptions,
    VesselLayerOptions {}

/**
 * Build the deck.gl layer stack for the maritime map.
 *
 * Called on every state change and handed to `MapboxOverlay.setProps`, so it must
 * stay a pure function of the context — no module-level state, no side effects.
 *
 * Paint order (bottom → top):
 *   environment arrows → drift geometry → vessel tracks/markers → spill dots
 */
export function buildMaritimeLayers(context: MaritimeLayerContext): Layer[] {
  return [
    ...createEnvironmentLayers(context),
    ...createTrajectoryLayers(context),
    ...createVesselLayers(context),
    ...createSpillLayers(context),
  ] as Layer[];
}
