/**
 * Ocean displacement helpers for oil / vessel meshes.
 * Geographic X/Z stay under SimulationContext control; only Y + tilt come from waves.
 */

import type { OceanConfig } from './oceanConfig';
import { sampleOceanSurface, normalToEuler, type WaveSample } from './gerstnerWaves';
import { oceanRuntime } from './oceanRuntime';

const scratch: WaveSample = {
  dx: 0,
  dz: 0,
  h: 0,
  nx: 0,
  ny: 1,
  nz: 0,
  height: 0,
};

export function getWaveFollowY(
  worldX: number,
  worldZ: number,
  yOffset = 0.12,
  time?: number,
  config?: OceanConfig
): number {
  const t = time ?? oceanRuntime.time;
  const cfg = config ?? oceanRuntime.config;
  const s = sampleOceanSurface(worldX, worldZ, t, cfg, scratch);
  return s.h + yOffset;
}

export function getWaveFollowPose(
  worldX: number,
  worldZ: number,
  yOffset = 0.12,
  time?: number,
  config?: OceanConfig
): { y: number; pitch: number; roll: number; nx: number; ny: number; nz: number } {
  const t = time ?? oceanRuntime.time;
  const cfg = config ?? oceanRuntime.config;
  const s = sampleOceanSurface(worldX, worldZ, t, cfg, scratch);
  const tilt = normalToEuler(s.nx, s.ny, s.nz);
  return {
    y: s.h + yOffset,
    pitch: tilt.pitch,
    roll: tilt.roll,
    nx: s.nx,
    ny: s.ny,
    nz: s.nz,
  };
}

export { sampleOceanSurface, type WaveSample };