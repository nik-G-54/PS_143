/**
 * Central ocean visualization config.
 * Adapted from WaterThreeJS OCEAN_CONFIG (MIT) — values scaled for Ocean Sentinel scene units.
 */

export interface OceanConfig {
  /** Primary wind direction in scene XZ (unit vector). Separate from waveDirection. */
  windDirection: { x: number; z: number };
  /** Normalized visual wind speed (affects amplitude / chop). */
  windSpeed: number;
  /** Wave propagation direction in scene XZ. May follow wind when no independent data. */
  waveDirection: { x: number; z: number };
  waveAmplitude: number;
  waveFrequency: number;
  waveSteepness: number;
  waveSpeed: number;
  waveCount: number;
  baseWavelength: number;
  dirSpread: number;
  freqMul: number;
  ampMul: number;
  surfaceY: number;
  detailScale: number;
  detailStrength: number;
  roughness: number;
  foamThreshold: number;
  foamSoftness: number;
  crestFoamStart: number;
  foamCoverage: number;
  foamEdge: number;
  foamOpacity: number;
  deepColor: string;
  shallowColor: string;
  foamColor: string;
  sssColor: string;
  sssStrength: number;
}

/** Defaults tuned for tactical maritime view on a normal laptop GPU. */
export const DEFAULT_OCEAN_CONFIG: OceanConfig = {
  windDirection: { x: 1, z: 0.35 },
  windSpeed: 0.55,
  waveDirection: { x: 1, z: 0.35 },
  waveAmplitude: 0.48,
  waveFrequency: (2 * Math.PI) / 95,
  waveSteepness: 0.55,
  waveSpeed: 1.0,
  waveCount: 18,
  baseWavelength: 95,
  dirSpread: 0.9,
  freqMul: 1.19,
  ampMul: 0.82,
  surfaceY: 0,
  detailScale: 0.28,
  detailStrength: 0.12,
  roughness: 0.09,
  foamThreshold: 0.22,
  foamSoftness: 0.4,
  crestFoamStart: 0.55,
  foamCoverage: 0.85,
  foamEdge: 0.22,
  foamOpacity: 0.9,
  deepColor: '#001a33',
  shallowColor: '#0a6b7a',
  foamColor: '#f2f8fc',
  sssColor: '#1a8578',
  sssStrength: 0.28,
};

export function cloneOceanConfig(base: OceanConfig = DEFAULT_OCEAN_CONFIG): OceanConfig {
  return {
    ...base,
    windDirection: { ...base.windDirection },
    waveDirection: { ...base.waveDirection },
  };
}