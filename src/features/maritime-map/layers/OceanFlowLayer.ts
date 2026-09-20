import { ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { FlowParticle } from './oceanFlowParticles';
import { LAYER_IDS } from './layerIds';

export interface OceanFlowLayerOptions {
  windParticles: FlowParticle[];
  currentParticles: FlowParticle[];
  windColor: [number, number, number];
  currentColor: [number, number, number];
  /** 0..1 — drives the toggle's fade in/out, not per-particle transparency. */
  opacity: number;
}

/** Faster particles read brighter, within a floor that keeps slow ones visible. */
function speedAlpha(speedMs: number, maxSpeedMs: number, opacity: number): number {
  const t = Math.min(speedMs / maxSpeedMs, 1);
  return Math.round((130 + t * 125) * opacity);
}

function makeFlowLayer(
  id: string,
  particles: FlowParticle[],
  color: [number, number, number],
  maxSpeedMs: number,
  opacity: number
): Layer {
  const data = particles.filter((p) => p.valid);
  return new ScatterplotLayer<FlowParticle>({
    id,
    data,
    getPosition: (d) => [d.lon, d.lat],
    getFillColor: (d) => [color[0], color[1], color[2], speedAlpha(d.speed, maxSpeedMs, opacity)],
    getRadius: 1.5,
    radiusUnits: 'pixels',
    radiusMinPixels: 2.2,
    radiusMaxPixels: 4,
    stroked: false,
    filled: true,
    pickable: false,
  });
}

/** Typical wind/current magnitudes, m/s — just the top of the brightness ramp, not a hard clamp. */
const WIND_SPEED_CEILING_MS = 20;
const CURRENT_SPEED_CEILING_MS = 1.5;

export function createOceanFlowLayers(options: OceanFlowLayerOptions): Layer[] {
  const { windParticles, currentParticles, windColor, currentColor, opacity } = options;
  if (opacity <= 0.001) return [];

  return [
    makeFlowLayer(LAYER_IDS.oceanFlowWind, windParticles, windColor, WIND_SPEED_CEILING_MS, opacity),
    makeFlowLayer(LAYER_IDS.oceanFlowCurrent, currentParticles, currentColor, CURRENT_SPEED_CEILING_MS, opacity),
  ];
}
