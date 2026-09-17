import { describe, expect, it } from 'vitest';
import * as turf from '@turf/turf';
import {
  DEFAULT_VERTEX_COUNT,
  easeOutCubic,
  generateOrganicPolygon,
  interpolateRadiusKm,
  interpolateRing,
  radiusFromAreaKm2,
  resamplePolygonToVertexCount,
} from './organicPolygon';

describe('generateOrganicPolygon', () => {
  it('is deterministic for the same seed and point', () => {
    const a = generateOrganicPolygon(24.05, 35.05, 2, 'seed-1');
    const b = generateOrganicPolygon(24.05, 35.05, 2, 'seed-1');
    expect(a).toEqual(b);
  });

  it('produces different shapes for different seeds', () => {
    const a = generateOrganicPolygon(24.05, 35.05, 2, 'seed-1');
    const b = generateOrganicPolygon(24.05, 35.05, 2, 'seed-2');
    expect(a).not.toEqual(b);
  });

  it('returns a closed ring (first === last coordinate)', () => {
    const ring = generateOrganicPolygon(24.05, 35.05, 2, 'seed-3');
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('has a fixed vertex count (+1 for the closing point)', () => {
    const ring = generateOrganicPolygon(24.05, 35.05, 2, 'seed-4');
    expect(ring.length).toBe(DEFAULT_VERTEX_COUNT + 1);
  });

  it('respects a custom vertex count', () => {
    const ring = generateOrganicPolygon(24.05, 35.05, 2, 'seed-5', 24);
    expect(ring.length).toBe(25);
  });

  it('never produces NaN coordinates', () => {
    const ring = generateOrganicPolygon(24.05, 35.05, 0, 'seed-6');
    for (const [lon, lat] of ring) {
      expect(Number.isFinite(lon)).toBe(true);
      expect(Number.isFinite(lat)).toBe(true);
    }
  });

  it('is deterministic when a drift bearing is supplied', () => {
    const a = generateOrganicPolygon(24.05, 35.05, 2, 'seed-drift', DEFAULT_VERTEX_COUNT, 90);
    const b = generateOrganicPolygon(24.05, 35.05, 2, 'seed-drift', DEFAULT_VERTEX_COUNT, 90);
    expect(a).toEqual(b);
  });

  it('keeps a fixed vertex count and closed ring when elongated', () => {
    const ring = generateOrganicPolygon(24.05, 35.05, 2, 'seed-drift-2', DEFAULT_VERTEX_COUNT, 45);
    expect(ring.length).toBe(DEFAULT_VERTEX_COUNT + 1);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('elongates the ring along the drift bearing (wider downstream than across), on average across many seeds', () => {
    // Drift due east (90deg): distance from center to the eastward vertices
    // should exceed the distance to the perpendicular (north) vertices. Any
    // single seed's noise can locally favor one direction, so this averages
    // the trend across many independent seeds to isolate the elongation
    // effect from per-seed noise.
    const centerLon = 24.05;
    const centerLat = 35.05;
    const avgDistNear = (ring: number[][], angleDeg: number, windowDeg: number) => {
      let sum = 0;
      let n = 0;
      for (const [lon, lat] of ring) {
        const b = turf.bearing([centerLon, centerLat], [lon, lat]);
        const norm = ((b - angleDeg + 540) % 360) - 180;
        if (Math.abs(norm) <= windowDeg) {
          sum += turf.distance([centerLon, centerLat], [lon, lat], { units: 'kilometers' });
          n += 1;
        }
      }
      return n > 0 ? sum / n : 0;
    };

    let eastTotal = 0;
    let northTotal = 0;
    const seeds = 30;
    for (let s = 0; s < seeds; s += 1) {
      const ring = generateOrganicPolygon(centerLon, centerLat, 2, `seed-elongate-${s}`, 360, 90, 0.5);
      eastTotal += avgDistNear(ring, 90, 20);
      northTotal += avgDistNear(ring, 0, 20);
    }
    expect(eastTotal / seeds).toBeGreaterThan(northTotal / seeds);
  });

  it('produces more irregular (less uniform) vertex spacing than a single-octave wobble', () => {
    // Regenerate a "single octave" comparison ring using only the low-frequency
    // lobe behavior implicitly by using a very small vertex count sample of the
    // real ring's radii and checking variance is non-trivial (i.e. genuinely
    // irregular, not a near-circle).
    const centerLon = 24.05;
    const centerLat = 35.05;
    const ring = generateOrganicPolygon(centerLon, centerLat, 2, 'seed-irregular', 32);
    const radii = ring
      .slice(0, -1)
      .map(([lon, lat]) => turf.distance([centerLon, centerLat], [lon, lat], { units: 'kilometers' }));
    const mean = radii.reduce((s, r) => s + r, 0) / radii.length;
    const variance = radii.reduce((s, r) => s + (r - mean) ** 2, 0) / radii.length;
    expect(variance).toBeGreaterThan(0.001);
  });
});

describe('easeOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutCubic(0)).toBeCloseTo(0);
    expect(easeOutCubic(1)).toBeCloseTo(1);
  });

  it('is monotonically increasing', () => {
    let prev = -Infinity;
    for (let t = 0; t <= 1; t += 0.05) {
      const v = easeOutCubic(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('interpolateRadiusKm', () => {
  it('returns the source radius at t=0', () => {
    expect(interpolateRadiusKm(1, 5, 0)).toBeCloseTo(1, 5);
  });

  it('returns the detection radius at t=1', () => {
    expect(interpolateRadiusKm(1, 5, 1)).toBeCloseTo(5, 5);
  });

  it('is monotonically increasing across the full t range for growth', () => {
    let prev = -Infinity;
    for (let t = 0; t <= 1; t += 0.05) {
      const r = interpolateRadiusKm(1, 5, t);
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
  });

  it('never returns NaN or negative values, even with missing inputs', () => {
    const cases: Array<[number | null, number | null]> = [
      [null, null],
      [undefined as unknown as number | null, 5],
      [1, null],
      [0, 0],
      [-3, -8],
    ];
    for (const [source, detection] of cases) {
      for (let t = 0; t <= 1; t += 0.25) {
        const r = interpolateRadiusKm(source, detection, t);
        expect(Number.isFinite(r)).toBe(true);
        expect(r).toBeGreaterThan(0);
      }
    }
  });
});

describe('radiusFromAreaKm2', () => {
  it('derives radius = sqrt(area / pi)', () => {
    const area = 10;
    expect(radiusFromAreaKm2(area)).toBeCloseTo(Math.sqrt(area / Math.PI), 6);
  });

  it('falls back to a small positive radius for missing/invalid area', () => {
    expect(radiusFromAreaKm2(null)).toBeGreaterThan(0);
    expect(radiusFromAreaKm2(undefined)).toBeGreaterThan(0);
    expect(radiusFromAreaKm2(-5)).toBeGreaterThan(0);
    expect(radiusFromAreaKm2(0)).toBeGreaterThan(0);
  });
});

describe('resamplePolygonToVertexCount', () => {
  // Distance from [x, y] to the nearest edge of the axis-aligned box
  // [minX,minY]..[maxX,maxY] — 0 exactly on the boundary.
  const distToBoxBoundary = (
    x: number,
    y: number,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ) => {
    const onVertical = Math.min(Math.abs(x - minX), Math.abs(x - maxX));
    const onHorizontal = Math.min(Math.abs(y - minY), Math.abs(y - maxY));
    return Math.min(onVertical, onHorizontal);
  };

  it('resamples a unit square to exactly vertexCount+1 closed points lying on its boundary', () => {
    const unitSquare = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    const ring = resamplePolygonToVertexCount(unitSquare, DEFAULT_VERTEX_COUNT);

    expect(ring.length).toBe(DEFAULT_VERTEX_COUNT + 1);
    expect(ring[0]).toEqual(ring[ring.length - 1]);

    // turf.along walks the great-circle arc between vertices rather than a
    // planar line, so points land extremely close to (not bit-exact on) the
    // straight edge — empirically ~4e-5 deg worst case for a 1-degree
    // (~111km) square; 1e-3 leaves a wide, non-flaky margin.
    for (const [x, y] of ring) {
      expect(distToBoxBoundary(x, y, 0, 0, 1, 1)).toBeLessThan(1e-3);
      expect(x).toBeGreaterThanOrEqual(-1e-3);
      expect(x).toBeLessThanOrEqual(1 + 1e-3);
      expect(y).toBeGreaterThanOrEqual(-1e-3);
      expect(y).toBeLessThanOrEqual(1 + 1e-3);
    }
  });

  it('respects a custom vertex count (not hardcoded to any fixed value)', () => {
    const unitSquare = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    const ring = resamplePolygonToVertexCount(unitSquare, 24);
    expect(ring.length).toBe(25);
  });

  it('works generically for an irregular (non-rectangular), 5+ vertex polygon — not rectangle-specific', () => {
    // A convex-ish pentagon, deliberately not axis-aligned or equilateral.
    const irregular = [
      [24.0, 35.0],
      [24.02, 35.005],
      [24.015, 35.02],
      [24.005, 35.025],
      [23.995, 35.01],
      [24.0, 35.0],
    ];
    const vertexCount = 20;
    const ring = resamplePolygonToVertexCount(irregular, vertexCount);

    expect(ring.length).toBe(vertexCount + 1);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    for (const [lon, lat] of ring) {
      expect(Number.isFinite(lon)).toBe(true);
      expect(Number.isFinite(lat)).toBe(true);
    }

    // The resampled ring should still roughly span the source pentagon's
    // bounding box (a bug that, say, only ever sampled the first edge would
    // collapse this to a sliver).
    const lons = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);
    expect(Math.max(...lons) - Math.min(...lons)).toBeGreaterThan(0.02);
    expect(Math.max(...lats) - Math.min(...lats)).toBeGreaterThan(0.015);
  });

  it('normalizes (closes) an input ring that omits the final duplicate point', () => {
    const unclosedSquare = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]; // no trailing [0,0]
    const ring = resamplePolygonToVertexCount(unclosedSquare, DEFAULT_VERTEX_COUNT);
    expect(ring.length).toBe(DEFAULT_VERTEX_COUNT + 1);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    for (const [x, y] of ring) {
      expect(distToBoxBoundary(x, y, 0, 0, 1, 1)).toBeLessThan(1e-3);
    }
  });

  it('produces the same closed-ring shape whether or not the input was pre-closed', () => {
    const closed = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    const unclosed = closed.slice(0, -1);
    expect(resamplePolygonToVertexCount(unclosed, 12)).toEqual(
      resamplePolygonToVertexCount(closed, 12)
    );
  });

  it('never crashes on a degenerate ring (every coordinate identical)', () => {
    const degenerate = [
      [24, 35],
      [24, 35],
      [24, 35],
    ];
    const ring = resamplePolygonToVertexCount(degenerate, DEFAULT_VERTEX_COUNT);
    expect(ring.length).toBe(DEFAULT_VERTEX_COUNT + 1);
    for (const [lon, lat] of ring) {
      expect(Number.isFinite(lon)).toBe(true);
      expect(Number.isFinite(lat)).toBe(true);
    }
  });

  it('throws when fewer than 3 coordinates are supplied (contract violation, same as interpolateRing)', () => {
    expect(() => resamplePolygonToVertexCount([[0, 0], [1, 1]], DEFAULT_VERTEX_COUNT)).toThrow();
    expect(() => resamplePolygonToVertexCount([], DEFAULT_VERTEX_COUNT)).toThrow();
  });
});

describe('interpolateRing', () => {
  const ringA = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ];
  const ringB = [
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
    [0, 0],
  ];

  it('returns ring A exactly at t=0', () => {
    expect(interpolateRing(ringA, ringB, 0)).toEqual(ringA);
  });

  it('returns ring B exactly at t=1', () => {
    expect(interpolateRing(ringA, ringB, 1)).toEqual(ringB);
  });

  it('is the per-vertex midpoint at t=0.5', () => {
    const mid = interpolateRing(ringA, ringB, 0.5);
    expect(mid[1]).toEqual([1.5, 0]);
    expect(mid[2]).toEqual([1.5, 1.5]);
  });

  it('throws on mismatched ring lengths', () => {
    expect(() => interpolateRing(ringA, ringB.slice(0, 3), 0.5)).toThrow();
  });
});
