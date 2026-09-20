// CPU-side particle advection for the wind/current overlay — deliberately
// plain JS + stock deck.gl layers (LineLayer, see OceanFlowLayer.ts) rather
// than a GPU-shader particle library: the two candidate libraries
// (deck.gl-particle, @deck.gl-community/geo-layers) both target a deck.gl
// major/minor this project doesn't run, and pulling either in destabilized
// the existing map (see PR discussion). This has no version coupling at all.

import type { FlowGrid } from '../types/oceanFlowTypes';

export interface FlowParticle {
  lon: number;
  lat: number;
  prevLon: number;
  prevLat: number;
  age: number;
  maxAge: number;
  /** Last sampled speed, m/s — drives the rendered segment's brightness. */
  speed: number;
  /** False on the tick a particle respawns — skip rendering that tick so it doesn't draw a jump line. */
  valid: boolean;
}

const METERS_PER_DEGREE_LAT = 111_320;

function sampleVelocity(grid: FlowGrid, lon: number, lat: number): { u: number; v: number } | null {
  const { cols, rows, lonMin, lonMax, latMin, latMax, points } = grid;
  if (lon < lonMin || lon > lonMax || lat < latMin || lat > latMax) return null;

  const colF = ((lon - lonMin) / (lonMax - lonMin)) * (cols - 1);
  const rowF = ((lat - latMin) / (latMax - latMin)) * (rows - 1);
  const col0 = Math.floor(colF);
  const row0 = Math.floor(rowF);
  const col1 = Math.min(col0 + 1, cols - 1);
  const row1 = Math.min(row0 + 1, rows - 1);
  const tx = colF - col0;
  const ty = rowF - row0;

  const p00 = points[row0 * cols + col0];
  const p10 = points[row0 * cols + col1];
  const p01 = points[row1 * cols + col0];
  const p11 = points[row1 * cols + col1];
  if (p00.u == null || p10.u == null || p01.u == null || p11.u == null) return null;
  if (p00.v == null || p10.v == null || p01.v == null || p11.v == null) return null;

  const u0 = p00.u + (p10.u - p00.u) * tx;
  const u1 = p01.u + (p11.u - p01.u) * tx;
  const v0 = p00.v + (p10.v - p00.v) * tx;
  const v1 = p01.v + (p11.v - p01.v) * tx;

  return { u: u0 + (u1 - u0) * ty, v: v0 + (v1 - v0) * ty };
}

function randomInDomain(grid: FlowGrid): { lon: number; lat: number } {
  return {
    lon: grid.lonMin + Math.random() * (grid.lonMax - grid.lonMin),
    lat: grid.latMin + Math.random() * (grid.latMax - grid.latMin),
  };
}

/** Picks a random point known to carry real data — used for current particles so they spawn over open water, not land. */
function randomValidPoint(grid: FlowGrid): { lon: number; lat: number } {
  const valid = grid.points.filter((p) => p.u != null && p.v != null);
  if (valid.length === 0) return randomInDomain(grid);
  const p = valid[Math.floor(Math.random() * valid.length)];
  const lonJitter = (grid.lonMax - grid.lonMin) / (grid.cols - 1);
  const latJitter = (grid.latMax - grid.latMin) / (grid.rows - 1);
  return {
    lon: p.longitude + (Math.random() - 0.5) * lonJitter,
    lat: p.latitude + (Math.random() - 0.5) * latJitter,
  };
}

function spawn(grid: FlowGrid, requireValidData: boolean): FlowParticle {
  const { lon, lat } = requireValidData ? randomValidPoint(grid) : randomInDomain(grid);
  return {
    lon,
    lat,
    prevLon: lon,
    prevLat: lat,
    // Staggered starting age so particles don't all respawn in the same tick, which would read as a flicker.
    age: Math.floor(Math.random() * 60),
    maxAge: 40 + Math.random() * 60,
    speed: 0,
    valid: false,
  };
}

export function createParticles(grid: FlowGrid, count: number, requireValidData: boolean): FlowParticle[] {
  return Array.from({ length: count }, () => spawn(grid, requireValidData));
}

/**
 * Advances every particle one tick in place. A particle that leaves the grid,
 * goes stale, or lands on a no-data cell (open ocean current grid over land)
 * respawns immediately rather than being rendered mid-jump.
 */
export function stepParticles(
  particles: FlowParticle[],
  grid: FlowGrid,
  requireValidData: boolean,
  simulatedSecondsPerTick: number
): void {
  for (const particle of particles) {
    particle.age += 1;
    const velocity = sampleVelocity(grid, particle.lon, particle.lat);

    if (!velocity || particle.age > particle.maxAge) {
      const next = spawn(grid, requireValidData);
      particle.lon = next.lon;
      particle.lat = next.lat;
      particle.prevLon = next.lon;
      particle.prevLat = next.lat;
      particle.age = 0;
      particle.maxAge = next.maxAge;
      particle.speed = 0;
      particle.valid = false;
      continue;
    }

    particle.prevLon = particle.lon;
    particle.prevLat = particle.lat;

    const latRad = (particle.lat * Math.PI) / 180;
    const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos(latRad);
    particle.lon += (velocity.u * simulatedSecondsPerTick) / Math.max(metersPerDegreeLon, 1);
    particle.lat += (velocity.v * simulatedSecondsPerTick) / METERS_PER_DEGREE_LAT;
    particle.speed = Math.hypot(velocity.u, velocity.v);
    particle.valid = true;
  }
}
