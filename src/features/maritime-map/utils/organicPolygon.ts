// src/features/maritime-map/utils/organicPolygon.ts
//
// Deterministic, seeded geometry helpers for "Focus Mode" oil-spill polygons.
// Pure functions only — no rendering, no rAF, no React. Kept separate so the
// math (noise perturbation, area/radius easing, vertex-wise morphing) is
// independently unit-testable.

import * as turf from '@turf/turf';

/**
 * Fixed vertex count so keyframe polygons can be interpolated index-wise.
 * High enough (Nyquist 48) to carry the fractal edge octave below without
 * aliasing it into jagged spikes.
 */
export const DEFAULT_VERTEX_COUNT = 96;

/**
 * Mulberry32 — a tiny deterministic PRNG. Same seed always produces the same
 * sequence, which is what lets a keyframe polygon be regenerated identically
 * (e.g. on re-render) without flickering.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash an arbitrary string/number seed into a 32-bit unsigned int (FNV-1a). */
export function hashSeed(input: string | number): number {
  const str = String(input);
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Ease-out cubic: fast growth that tapers off, matching real oil spreading. */
export function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - (1 - clamped) ** 3;
}

/**
 * Generate one organic, closed-ring polygon (GeoJSON [lon, lat] pairs, first
 * === last) centered at (centerLon, centerLat) with the given nominal radius
 * in km.
 *
 * Realism technique: two-octave deterministic sine noise + an optional
 * drift-direction elongation bias.
 *
 *  - Octave 1 ("lobes"): 2-4 low-frequency harmonics with large amplitude,
 *    which is what produces a few big rounded lobes/bulges rather than a
 *    uniform circle — real slicks are rarely radially symmetric, they bulge
 *    where more oil has pooled.
 *  - Octave 2 ("tendrils"): several higher-frequency, lower-amplitude
 *    harmonics layered on top of octave 1. This is the classic
 *    fractal/multi-octave-noise trick (same idea as Perlin/simplex fBm, just
 *    hand-rolled with sine harmonics instead of gradient noise) — it roughens
 *    the edge with small ragged, thread-like irregularities so the outline
 *    reads as a torn/spreading film rather than a smooth blob.
 *  - Elongation bias: when `driftBearingDeg` is supplied (the direction the
 *    slick is drifting, in compass degrees), radius is stretched along that
 *    bearing and compressed perpendicular to it, so the slick reads as
 *    stretched downstream by current/wind rather than a symmetric blob. This
 *    is purely multiplicative on top of the noise wobble and defaults to no
 *    bias (1.0 everywhere) when omitted, so existing callers are unaffected.
 *
 * Deterministic: same (seed, vertexCount) always yields the same ring shape,
 * and always the same fixed vertex count, so index-wise keyframe
 * interpolation in oilSlickKeyframes.ts keeps working unchanged.
 */
export function generateOrganicPolygon(
  centerLon: number,
  centerLat: number,
  radiusKm: number,
  seed: number | string,
  vertexCount: number = DEFAULT_VERTEX_COUNT,
  driftBearingDeg?: number | null,
  elongationStrength: number = 0.35
): number[][] {
  const safeRadius = Math.max(radiusKm, 0.01);
  const count = Math.max(4, Math.floor(vertexCount));
  const rand = mulberry32(hashSeed(seed));

  // Octave 1: large, low-frequency lobes.
  const lobeHarmonics = [
    { freq: 2 + Math.floor(rand() * 2), amp: 0.16 + rand() * 0.14, phase: rand() * Math.PI * 2 },
    { freq: 3 + Math.floor(rand() * 2), amp: 0.1 + rand() * 0.1, phase: rand() * Math.PI * 2 },
  ];

  // Octave 2: smaller, higher-frequency ragged edge detail layered on top.
  const tendrilHarmonics = [
    { freq: 7 + Math.floor(rand() * 3), amp: 0.05 + rand() * 0.05, phase: rand() * Math.PI * 2 },
    { freq: 11 + Math.floor(rand() * 4), amp: 0.035 + rand() * 0.035, phase: rand() * Math.PI * 2 },
    { freq: 17 + Math.floor(rand() * 5), amp: 0.02 + rand() * 0.02, phase: rand() * Math.PI * 2 },
  ];

  // Octave 3: fine fractal fringe. Seeded from the seed's stable prefix (the
  // part before any ":<keyframe>" suffix — see oilSlickKeyframes.ts) rather
  // than the full per-keyframe seed, so the fine edge texture stays put while
  // the big lobes morph between keyframes instead of shimmering every frame.
  // Only applied when the ring has enough vertices to carry it.
  const fineRand = mulberry32(hashSeed(String(seed).split(':')[0]));
  const fractalHarmonics =
    count >= 64
      ? [
          { freq: 23 + Math.floor(fineRand() * 5), amp: 0.022 + fineRand() * 0.014, phase: fineRand() * Math.PI * 2 },
          { freq: 31 + Math.floor(fineRand() * 6), amp: 0.014 + fineRand() * 0.01, phase: fineRand() * Math.PI * 2 },
          { freq: 41 + Math.floor(fineRand() * 5), amp: 0.008 + fineRand() * 0.006, phase: fineRand() * Math.PI * 2 },
        ]
      : [];

  // Tendrils: one or two narrow arms reaching out of the body (a Gaussian
  // bump in radius over a small arc) — the finger-like streamers real slicks
  // pull out along wind rows. Stable-seeded like octave 3 so arms don't jump
  // between keyframes.
  const tendrils =
    count >= 64
      ? Array.from({ length: 2 }, () => ({
          angle: fineRand() * Math.PI * 2,
          amp: 0.2 + fineRand() * 0.18,
          width: 0.14 + fineRand() * 0.08,
        }))
      : [];

  const hasDrift = driftBearingDeg != null && Number.isFinite(driftBearingDeg);
  const driftRad = hasDrift ? ((driftBearingDeg as number) * Math.PI) / 180 : 0;
  const strength = Math.max(0, elongationStrength);

  const coords: number[][] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;

    let wobble = 1;
    for (const h of lobeHarmonics) {
      wobble += h.amp * Math.sin(angle * h.freq + h.phase);
    }
    for (const h of tendrilHarmonics) {
      wobble += h.amp * Math.sin(angle * h.freq + h.phase);
    }
    for (const h of fractalHarmonics) {
      wobble += h.amp * Math.sin(angle * h.freq + h.phase);
    }
    for (const t of tendrils) {
      const d = Math.atan2(Math.sin(angle - t.angle), Math.cos(angle - t.angle));
      wobble += t.amp * Math.exp(-((d / t.width) ** 2));
    }
    wobble = Math.max(0.45, wobble);

    // Elongate along the drift bearing, compress perpendicular to it.
    // cos(angle - driftRad) is +1 pointing downstream, -1 upstream, 0 across.
    let elongation = 1;
    if (hasDrift) {
      // `angle` here is already a compass bearing in radians (0 = north,
      // clockwise), matching driftRad, so they compare directly.
      const alignment = Math.cos(angle - driftRad);
      elongation = 1 + strength * alignment - strength * 0.25 * (1 - alignment * alignment);
      elongation = Math.max(0.4, elongation);
    }

    const bearingDeg = (angle * 180) / Math.PI;
    const dest = turf.destination([centerLon, centerLat], safeRadius * wobble * elongation, bearingDeg, {
      units: 'kilometers',
    });
    coords.push(dest.geometry.coordinates);
  }

  coords.push([coords[0][0], coords[0][1]]);
  return coords;
}

/**
 * Interpolate a radius (km) between a source and detection radius using an
 * ease-out curve applied to AREA (not radius) — oil spreads fast then slows,
 * and area is the physically meaningful quantity to ease.
 *
 * Guards against null/zero/negative inputs so callers never get NaN.
 */
export function interpolateRadiusKm(
  sourceRadiusKm: number | null | undefined,
  detectionRadiusKm: number | null | undefined,
  t: number
): number {
  const MIN_RADIUS_KM = 0.01;
  const r0 = Number.isFinite(sourceRadiusKm) && (sourceRadiusKm as number) > 0
    ? (sourceRadiusKm as number)
    : MIN_RADIUS_KM;
  const r1 = Number.isFinite(detectionRadiusKm) && (detectionRadiusKm as number) > 0
    ? (detectionRadiusKm as number)
    : Math.max(r0, MIN_RADIUS_KM);

  const ease = easeOutCubic(t);
  const areaSource = Math.PI * r0 * r0;
  const areaDetection = Math.PI * r1 * r1;
  const area = areaSource + (areaDetection - areaSource) * ease;
  const safeArea = Number.isFinite(area) && area > 0 ? area : Math.PI * MIN_RADIUS_KM * MIN_RADIUS_KM;

  return Math.sqrt(safeArea / Math.PI);
}

/** Derive an equivalent-area radius (km) from an area in km^2. */
export function radiusFromAreaKm2(areaKm2: number | null | undefined): number {
  const MIN_RADIUS_KM = 0.01;
  if (!Number.isFinite(areaKm2) || (areaKm2 as number) <= 0) return MIN_RADIUS_KM;
  return Math.sqrt((areaKm2 as number) / Math.PI);
}

/** Close a ring (append the first coordinate) if it isn't already closed. Some APIs omit the final duplicate point. */
function closeRing(coords: number[][]): number[][] {
  if (coords.length === 0) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return coords;
  return [...coords, [first[0], first[1]]];
}

/**
 * Resample an arbitrary polygon ring (any vertex count, closed or not) to a
 * FIXED vertex count by walking evenly-spaced points along its perimeter.
 *
 * This is what lets an authoritative, real (SAR/EO-derived) detected polygon
 * — which may have any number of vertices — be dropped into the same
 * fixed-vertex-count keyframe slot `generateOrganicPolygon` fills everywhere
 * else, so `interpolateRing`'s vertex-wise lerp keeps working unmodified
 * across the transition into/out of that keyframe.
 *
 * Generic over shape: it only ever reasons about distance along the
 * boundary, never about corners or vertex count, so a 4-corner bounding box
 * and an irregular many-sided polygon resample the same way.
 *
 * Returns a closed ring of exactly `vertexCount + 1` points (first === last),
 * matching `generateOrganicPolygon`'s own [count vertices + closing point]
 * contract exactly (same `Math.max(4, Math.floor(vertexCount))` clamp).
 *
 * Throws when fewer than 3 coordinates are supplied — same "throw on
 * contract violation" precedent as `interpolateRing` above. Callers with
 * potentially-invalid real-world polygon data (missing, too few points, etc.)
 * must validate and fall back BEFORE calling this (see
 * oilSlickKeyframes.ts's `buildDetectionKeyframeRing`), so this function's
 * own contract can stay simple: valid ring in, fixed-count ring out.
 */
export function resamplePolygonToVertexCount(
  coords: number[][],
  vertexCount: number
): number[][] {
  if (!Array.isArray(coords) || coords.length < 3) {
    throw new Error(
      `resamplePolygonToVertexCount: need at least 3 coordinates to resample a polygon ring, got ${coords?.length ?? 0}`
    );
  }

  const count = Math.max(4, Math.floor(vertexCount));
  const closed = closeRing(coords);
  const first = closed[0];
  const line = turf.lineString(closed);
  const perimeterKm = turf.length(line, { units: 'kilometers' });

  if (!Number.isFinite(perimeterKm) || perimeterKm <= 0) {
    // Degenerate ring (every point coincides) — collapse every sample to the
    // same point rather than dividing by zero or handing turf.along a
    // meaningless distance.
    const collapsed: number[][] = Array.from({ length: count }, () => [first[0], first[1]]);
    collapsed.push([first[0], first[1]]);
    return collapsed;
  }

  const sampled: number[][] = [];
  for (let i = 0; i < count; i += 1) {
    // i=0 lands exactly on `first`; i < count keeps every sample strictly
    // before the full perimeter so turf.along never sees distance===length.
    const distanceKm = (i / count) * perimeterKm;
    const along = turf.along(line, distanceKm, { units: 'kilometers' });
    sampled.push([along.geometry.coordinates[0], along.geometry.coordinates[1]]);
  }
  // Close on the true first vertex rather than trusting a turf.along sample
  // at distance===perimeter, which can land a hair short/long of the start
  // due to floating-point accumulation along the segments.
  sampled.push([first[0], first[1]]);
  return sampled;
}

/**
 * Vertex-wise linear interpolation between two closed rings of equal length.
 * t=0 returns ringA exactly, t=1 returns ringB exactly.
 */
export function interpolateRing(ringA: number[][], ringB: number[][], t: number): number[][] {
  if (ringA.length !== ringB.length) {
    throw new Error(
      `interpolateRing: ring length mismatch (${ringA.length} vs ${ringB.length}) — keyframes must share a fixed vertex count`
    );
  }
  const clamped = Math.min(1, Math.max(0, t));
  return ringA.map((a, i) => {
    const b = ringB[i];
    return [a[0] + (b[0] - a[0]) * clamped, a[1] + (b[1] - a[1]) * clamped];
  });
}
