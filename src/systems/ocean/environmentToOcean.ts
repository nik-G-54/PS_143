/**
 * Adapter: backend environment wind → OceanConfig wave/wind parameters.
 * Does not mutate API data; visualization only.
 */

import type { OceanConfig } from './oceanConfig';
import { cloneOceanConfig, DEFAULT_OCEAN_CONFIG } from './oceanConfig';

export interface BackendWindLike {
  speed?: number;
  direction?: number;
  u?: number;
  v?: number;
}

export interface BackendEnvironmentLike {
  wind?: BackendWindLike | null;
  current?: BackendWindLike | null;
}

/**
 * Meteorological / scene flow direction (degrees) where 0 = toward North, 90 = toward East.
 * Maps to Three.js scene XZ: X = East, Z = -North.
 */
export function directionDegToSceneXZ(directionDeg: number): { x: number; z: number } {
  const rad = (directionDeg * Math.PI) / 180;
  const east = Math.sin(rad);
  const north = Math.cos(rad);
  return { x: east, z: -north };
}

function resolveDirectionDeg(wind?: BackendWindLike | null): number {
  if (!wind) return 45;
  if (typeof wind.direction === 'number' && !Number.isNaN(wind.direction)) {
    return ((wind.direction % 360) + 360) % 360;
  }
  if (typeof wind.u === 'number' && typeof wind.v === 'number') {
    return ((Math.atan2(wind.u, wind.v) * 180) / Math.PI + 360) % 360;
  }
  return 45;
}

function resolveSpeedMps(wind?: BackendWindLike | null): number {
  if (!wind) return 6;
  if (typeof wind.speed === 'number' && !Number.isNaN(wind.speed)) return Math.max(0, wind.speed);
  if (typeof wind.u === 'number' && typeof wind.v === 'number') {
    return Math.hypot(wind.u, wind.v);
  }
  return 6;
}

/**
 * Map backend wind into ocean visual parameters.
 * windDirection and waveDirection stay separate fields; for the demo,
 * waveDirection follows windDirection when no independent wave data exists.
 */
export function environmentToOceanConfig(
  environment: BackendEnvironmentLike | null | undefined,
  opts?: { lite?: boolean; night?: boolean; base?: OceanConfig }
): OceanConfig {
  const cfg = cloneOceanConfig(opts?.base ?? DEFAULT_OCEAN_CONFIG);
  const wind = environment?.wind;
  const directionDeg = resolveDirectionDeg(wind);
  const speedMps = resolveSpeedMps(wind);
  const dir = directionDegToSceneXZ(directionDeg);

  cfg.windDirection = { ...dir };
  // Demo: waves follow wind when no independent wave-direction feed exists.
  cfg.waveDirection = { ...dir };

  // Visual normalization — not physically exact Beaufort modelling.
  const windNorm = Math.min(1.35, speedMps / 12);
  cfg.windSpeed = windNorm;
  cfg.waveAmplitude = (opts?.night ? 0.32 : 0.38) + windNorm * 0.42;
  cfg.waveSteepness = 0.4 + windNorm * 0.35;
  cfg.waveSpeed = 0.85 + windNorm * 0.35;
  cfg.crestFoamStart = Math.max(0.35, 0.75 - windNorm * 0.25);
  cfg.foamCoverage = 0.55 + windNorm * 0.55;

  if (opts?.lite) {
    cfg.waveCount = 12;
    cfg.detailStrength = 0.08;
  } else {
    cfg.waveCount = 18;
  }

  if (opts?.night) {
    cfg.deepColor = '#010c1c';
    cfg.shallowColor = '#0a3a52';
    cfg.sssStrength = 0.12;
    cfg.foamOpacity = 0.65;
  }

  // Frequency from wavelength (WaterThreeJS: baseFreq = 2π / wavelength)
  cfg.baseWavelength = opts?.lite ? 110 : 95;
  cfg.waveFrequency = (2 * Math.PI) / cfg.baseWavelength;

  return cfg;
}