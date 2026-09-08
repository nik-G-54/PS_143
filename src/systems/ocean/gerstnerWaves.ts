/**
 * CPU-side Gerstner spectrum — exact port of WaterThreeJS Ocean.js sampleOcean / surfaceSample.
 * Copyright (c) 2026 mohamedachrefelouafi — MIT License (see ./LICENSE).
 *
 * Used so oil / vessels sit on the SAME wave field the GPU shader evaluates.
 */

import type { OceanConfig } from './oceanConfig';

const fract = (v: number) => v - Math.floor(v);

/** Exact CPU port of GLSL hash21(vec2) from WaterThreeJS common.js */
export function hash21(a: number, b: number): number {
  let px = fract(a * 123.34);
  let py = fract(b * 456.21);
  const d = px * (px + 45.32) + py * (py + 45.32);
  px += d;
  py += d;
  return fract(px * py);
}

export interface WaveSample {
  /** Horizontal Gerstner displacement at rest position */
  dx: number;
  dz: number;
  /** Absolute surface height (surfaceY + vertical displacement) */
  h: number;
  /** Analytic surface normal */
  nx: number;
  ny: number;
  nz: number;
  /** Vertical displacement only */
  height: number;
}

function emptySample(): WaveSample {
  return { dx: 0, dz: 0, h: 0, nx: 0, ny: 1, nz: 0, height: 0 };
}

/**
 * Full Gerstner sample at a REST position (same math as GPU sampleOcean).
 * Direction uses config.waveDirection (may equal wind for the demo).
 */
export function sampleGerstnerAtRest(
  x: number,
  z: number,
  time: number,
  config: OceanConfig,
  out: WaveSample = emptySample()
): WaveSample {
  const baseAngle = Math.atan2(config.waveDirection.z, config.waveDirection.x);
  const count = config.waveCount | 0;
  const choppy = config.waveSteepness;
  const speed = config.waveSpeed;
  const spread = config.dirSpread;
  let freq = config.waveFrequency;
  let amp = config.waveAmplitude;

  let dispX = 0;
  let dispY = 0;
  let dispZ = 0;
  let nx = 0;
  let ny = 1;
  let nz = 0;

  for (let i = 0; i < count; i++) {
    const r0 = hash21(i, 1.7);
    const r1 = hash21(i, 9.1);
    const angle = baseAngle + (r0 * 2 - 1) * spread;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const w = freq;
    const A = amp;
    const phase = Math.sqrt(9.81 * w) * speed;
    const Q = choppy / Math.max(w * A * count, 1e-3);
    const arg = w * (dx * x + dz * z) + time * phase + r1 * 6.2831853;
    const s = Math.sin(arg);
    const c = Math.cos(arg);
    const WA = w * A;
    dispX += Q * A * dx * c;
    dispZ += Q * A * dz * c;
    dispY += A * s;
    nx -= dx * WA * c;
    nz -= dz * WA * c;
    ny -= Q * WA * s;
    freq *= config.freqMul;
    amp *= config.ampMul;
  }

  const inv = 1 / Math.hypot(nx, ny, nz);
  out.dx = dispX;
  out.dz = dispZ;
  out.height = dispY;
  out.h = config.surfaceY + dispY;
  out.nx = nx * inv;
  out.ny = ny * inv;
  out.nz = nz * inv;
  return out;
}

/**
 * Height / normal of the VISIBLE water surface above world (x, z).
 * Inverts Gerstner horizontal displacement with fixed-point iterations
 * (WaterThreeJS Ocean.surfaceSample).
 */
export function sampleOceanSurface(
  x: number,
  z: number,
  time: number,
  config: OceanConfig,
  out: WaveSample = emptySample()
): WaveSample {
  let rx = x;
  let rz = z;
  for (let it = 0; it < 4; it++) {
    sampleGerstnerAtRest(rx, rz, time, config, out);
    rx = x - out.dx;
    rz = z - out.dz;
  }
  return sampleGerstnerAtRest(rx, rz, time, config, out);
}

/** Fast vertical-only height (ignores choppiness). Good for trajectory Y offset. */
export function oceanHeightAt(
  x: number,
  z: number,
  time: number,
  config: OceanConfig
): number {
  const baseAngle = Math.atan2(config.waveDirection.z, config.waveDirection.x);
  let freq = config.waveFrequency;
  let amp = config.waveAmplitude;
  const count = config.waveCount | 0;
  let h = 0;
  for (let i = 0; i < count; i++) {
    const r0 = hash21(i, 1.7);
    const r1 = hash21(i, 9.1);
    const angle = baseAngle + (r0 * 2 - 1) * config.dirSpread;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const phase = Math.sqrt(9.81 * freq) * config.waveSpeed;
    const arg = freq * (dx * x + dz * z) + time * phase + r1 * 6.2831853;
    h += amp * Math.sin(arg);
    freq *= config.freqMul;
    amp *= config.ampMul;
  }
  return config.surfaceY + h;
}

/** Build a Three.js-friendly quaternion that aligns +Y with the wave normal. */
export function normalToEuler(nx: number, ny: number, nz: number): { pitch: number; roll: number } {
  // Subtle tilt only — clamp for readability of oil/vessel icons.
  const pitch = Math.atan2(nz, Math.max(0.2, ny));
  const roll = Math.atan2(-nx, Math.max(0.2, ny));
  const maxTilt = 0.28;
  return {
    pitch: Math.max(-maxTilt, Math.min(maxTilt, pitch)),
    roll: Math.max(-maxTilt, Math.min(maxTilt, roll)),
  };
}