// src/lib/windTextureGenerator.ts
import type { WindField, WindTextureData } from '../types/wind';

/**
 * Generate a wind texture from a single-point wind vector.
 * The u/v values are spread uniformly across a bounding box around the spill,
 * with slight Gaussian falloff at edges for natural look.
 */
export function generateWindTexture(
  wind: WindField,
  bounds: [number, number, number, number], // [west, south, east, north]
  resolution: number = 256
): WindTextureData {
  const [west, south, east, north] = bounds;
  const width = resolution;
  const height = Math.round(resolution * Math.max(0.1, ((north - south) / Math.max(0.0001, (east - west)))));
  
  const data = new Uint8Array(width * height * 4);
  
  // Normalize u/v to [0, 255] range for RGBA encoding
  // Use wind speed as scale reference
  const maxVel = Math.max(Math.abs(wind.u), Math.abs(wind.v), 0.1) * 1.5;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate normalized coordinates
      const nx = x / width;
      const ny = y / height;
      
      // Gaussian falloff from center
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const falloff = Math.exp(-dist * dist * 8); // Tight Gaussian
      
      // Add slight noise variation for organic look
      const noise = 0.85 + 0.15 * Math.sin(nx * 12 + ny * 8) * Math.cos(nx * 6 - ny * 10);
      
      // Encode u velocity into Red channel
      const uNorm = ((wind.u * falloff * noise) / maxVel + 1) / 2; // Map [-max, max] to [0, 1]
      data[idx] = Math.round(Math.max(0, Math.min(255, uNorm * 255)));
      
      // Encode v velocity into Green channel
      const vNorm = ((wind.v * falloff * noise) / maxVel + 1) / 2;
      data[idx + 1] = Math.round(Math.max(0, Math.min(255, vNorm * 255)));
      
      // Blue: unused
      data[idx + 2] = 0;
      // Alpha: full opacity
      data[idx + 3] = 255;
    }
  }
  
  const imageData = new ImageData(
    new Uint8ClampedArray(data.buffer),
    width,
    height
  );
  
  return {
    width,
    height,
    bounds: [west, south, east, north],
    uMin: -maxVel,
    uMax: maxVel,
    vMin: -maxVel,
    vMax: maxVel,
    image: imageData,
  };
}

/**
 * Merge wind and current textures into a combined flow field.
 * Wind typically dominates at surface; current adds subsurface drift.
 * Weight: 70% wind, 30% current (configurable)
 */
export function generateCombinedFlowTexture(
  wind: WindField,
  current: WindField,
  bounds: [number, number, number, number],
  windWeight: number = 0.7,
  resolution: number = 256
): WindTextureData {
  const combined: WindField = {
    u: wind.u * windWeight + current.u * (1 - windWeight),
    v: wind.v * windWeight + current.v * (1 - windWeight),
    speed: 0, // Will be recalculated
    direction: 0,
    unit: wind.unit,
  };
  combined.speed = Math.sqrt(combined.u ** 2 + combined.v ** 2);
  combined.direction = (Math.atan2(combined.u, combined.v) * 180) / Math.PI;
  
  return generateWindTexture(combined, bounds, resolution);
}
