/**
 * Shared mutable ocean runtime — updated by OceanSurface each render frame.
 * Oil / vessels read the same time + config the GPU shader uses.
 * This is NOT a second simulation timeline; SimulationContext remains authoritative
 * for oil/AIS/vessel geographic state. Ocean time is visual wave animation only.
 */

import type { OceanConfig } from './oceanConfig';
import { cloneOceanConfig, DEFAULT_OCEAN_CONFIG } from './oceanConfig';
import { sampleOceanSurface, oceanHeightAt, type WaveSample } from './gerstnerWaves';

class OceanRuntime {
  time = 0;
  config: OceanConfig = cloneOceanConfig(DEFAULT_OCEAN_CONFIG);
  private _scratch: WaveSample = {
    dx: 0,
    dz: 0,
    h: 0,
    nx: 0,
    ny: 1,
    nz: 0,
    height: 0,
  };

  setFrame(time: number, config: OceanConfig) {
    this.time = time;
    this.config = config;
  }

  sample(x: number, z: number, out?: WaveSample): WaveSample {
    return sampleOceanSurface(x, z, this.time, this.config, out ?? this._scratch);
  }

  height(x: number, z: number): number {
    return oceanHeightAt(x, z, this.time, this.config);
  }
}

export const oceanRuntime = new OceanRuntime();