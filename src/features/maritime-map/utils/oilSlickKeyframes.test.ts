import { describe, expect, it } from 'vitest';
import * as turf from '@turf/turf';
import {
  buildOilSlickKeyframes,
  DETECTION_HANDOFF_THRESHOLD,
  detectionHandoffOpacity,
  distanceFromDetection,
  resolveKeyframeAt,
  resolvePolygonAtProgress,
  type OilSlickKeyframe,
} from './oilSlickKeyframes';
import {
  DEFAULT_VERTEX_COUNT,
  generateOrganicPolygon,
  interpolateRadiusKm,
  radiusFromAreaKm2,
} from './organicPolygon';

function makePoints(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    longitude: 24 + i * 0.01,
    latitude: 35 + i * 0.01,
    timestamp: new Date(Date.now() + i * 3_600_000).toISOString(),
  }));
}

describe('buildOilSlickKeyframes', () => {
  it('does not crash on a single-point trajectory and returns one static keyframe', () => {
    const kf = buildOilSlickKeyframes(makePoints(1), 0.5, 4, 'seed', DEFAULT_VERTEX_COUNT);
    expect(kf.length).toBe(1);
    expect(kf[0].ring.length).toBe(DEFAULT_VERTEX_COUNT + 1);
  });

  it('handles a two-point trajectory', () => {
    const kf = buildOilSlickKeyframes(makePoints(2), 0.5, 4, 'seed', DEFAULT_VERTEX_COUNT);
    expect(kf.length).toBe(2);
    expect(kf[0].ring).not.toEqual(kf[1].ring);
  });

  it('handles a large (78+ point) trajectory without error', () => {
    const kf = buildOilSlickKeyframes(makePoints(80), 0.5, 4, 'seed', DEFAULT_VERTEX_COUNT);
    expect(kf.length).toBe(80);
    for (const k of kf) {
      expect(k.ring.length).toBe(DEFAULT_VERTEX_COUNT + 1);
      for (const [lon, lat] of k.ring) {
        expect(Number.isFinite(lon)).toBe(true);
        expect(Number.isFinite(lat)).toBe(true);
      }
    }
  });

  it('gracefully falls back when sourceRadiusKm/detectionAreaKm2 are null', () => {
    const kf = buildOilSlickKeyframes(makePoints(5), null, null, 'seed', DEFAULT_VERTEX_COUNT);
    expect(kf.length).toBe(5);
    for (const k of kf) {
      for (const [lon, lat] of k.ring) {
        expect(Number.isFinite(lon)).toBe(true);
        expect(Number.isFinite(lat)).toBe(true);
      }
    }
  });

  it('grows radius from source to detection (ease-out area growth), first keyframe smaller than last', () => {
    const kf = buildOilSlickKeyframes(makePoints(10), 0.2, 50, 'seed-grow', DEFAULT_VERTEX_COUNT);
    const ringArea = (ring: number[][]) => {
      // Shoelace formula, good enough as a relative-size proxy for this test.
      let area = 0;
      for (let i = 0; i < ring.length - 1; i += 1) {
        area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
      }
      return Math.abs(area / 2);
    };
    expect(ringArea(kf[kf.length - 1].ring)).toBeGreaterThan(ringArea(kf[0].ring));
  });
});

// NOTE: this suite used to be "buildOilSlickKeyframes: real detection
// polygon" / "...: real detection polygon fallback" — it asserted that the
// detection (last) keyframe was built from the REAL, authoritative detected
// polygon (resampled via `resamplePolygonToVertexCount`) instead of organic
// generation, with a `detectionPolygon` argument controlling the swap.
//
// That shape-matching approach was abandoned (see oilSlickKeyframes.ts's
// `buildOilSlickKeyframes` docstring): real detection polygons are often
// low-vertex/near-rectangular, so resampling one made the traveling polygon
// visibly snap into a flat-edged shape right at detection instead of staying
// organic. `buildOilSlickKeyframes` no longer accepts a `detectionPolygon`
// argument at all — the detection keyframe is now built EXACTLY like every
// other keyframe (plain `generateOrganicPolygon`), and the handoff to the
// real shape happens visually instead, via the traveling polygon fading out
// (see `detectionHandoffOpacity` below, tested further down this file).
describe('buildOilSlickKeyframes: detection keyframe uses plain organic generation', () => {
  const farPoints = Array.from({ length: 4 }, (_, i) => ({
    longitude: -10 + i * 0.5,
    latitude: 50 + i * 0.5,
    timestamp: new Date(Date.now() + i * 3_600_000).toISOString(),
  }));

  it('builds the detection (last) keyframe with the exact same generateOrganicPolygon call every other keyframe uses', () => {
    const sourceRadiusKm = 0.5;
    const detectionAreaKm2 = 4;
    const seedKey = 'seed-detection-organic';

    const kf = buildOilSlickKeyframes(farPoints, sourceRadiusKm, detectionAreaKm2, seedKey, DEFAULT_VERTEX_COUNT);

    const n = farPoints.length;
    const last = farPoints[n - 1];
    const prev = farPoints[n - 2];
    const bearingDeg = turf.bearing([prev.longitude, prev.latitude], [last.longitude, last.latitude]);
    const detectionRadiusKm = radiusFromAreaKm2(detectionAreaKm2);
    const expectedRadius = interpolateRadiusKm(sourceRadiusKm, detectionRadiusKm, 1);
    const expectedRing = generateOrganicPolygon(
      last.longitude,
      last.latitude,
      expectedRadius,
      `${seedKey}:${n - 1}`,
      DEFAULT_VERTEX_COUNT,
      bearingDeg
    );

    expect(kf[kf.length - 1].ring).toEqual(expectedRing);
  });

  it('the detection keyframe is a plain, deterministic organic ring — not derived from any real polygon data', () => {
    const kf = buildOilSlickKeyframes(farPoints, 0.5, 4, 'seed-real', DEFAULT_VERTEX_COUNT);
    const detectionRing = kf[kf.length - 1].ring;

    // Organic generation centers on the trajectory's own last point, so the
    // ring sits near (lon -8, lat 52) — nowhere near a hypothetical
    // real-polygon footprint like the ~(24, 35) box the old suite used.
    const lons = detectionRing.map((p) => p[0]);
    const lats = detectionRing.map((p) => p[1]);
    const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    expect(centerLon).toBeCloseTo(farPoints[3].longitude, 0);
    expect(centerLat).toBeCloseTo(farPoints[3].latitude, 0);

    expect(detectionRing.length).toBe(DEFAULT_VERTEX_COUNT + 1);
    expect(detectionRing[0]).toEqual(detectionRing[detectionRing.length - 1]); // closed
  });

  it('behaves identically to a keyframe set built with no extra arguments at all (function no longer accepts a detectionPolygon parameter)', () => {
    // buildOilSlickKeyframes.length reflects the actual parameter count TS
    // would type-check calls against — confirms the parameter was removed,
    // not just made optional/no-op.
    expect(buildOilSlickKeyframes.length).toBe(5);

    const a = buildOilSlickKeyframes(farPoints, 0.5, 4, 'seed-same', DEFAULT_VERTEX_COUNT);
    const b = buildOilSlickKeyframes(farPoints, 0.5, 4, 'seed-same', DEFAULT_VERTEX_COUNT);
    expect(a).toEqual(b);
  });

  it('also builds the single keyframe of a one-point trajectory the same organic way (it is simultaneously origin and detection)', () => {
    const onePoint = [{ longitude: -10, latitude: 50, timestamp: new Date().toISOString() }];
    const kf = buildOilSlickKeyframes(onePoint, 0.5, 4, 'seed-real-one', DEFAULT_VERTEX_COUNT);
    expect(kf.length).toBe(1);

    const detectionRadiusKm = radiusFromAreaKm2(4);
    const expectedRadius = interpolateRadiusKm(0.5, detectionRadiusKm, 1);
    const expected = generateOrganicPolygon(-10, 50, expectedRadius, 'seed-real-one:0', DEFAULT_VERTEX_COUNT, null);
    expect(kf[0].ring).toEqual(expected);
  });
});

describe('resolveKeyframeAt', () => {
  const ringA: number[][] = [
    [0, 0],
    [1, 0],
    [0, 0],
  ];
  const ringB: number[][] = [
    [0, 0],
    [3, 0],
    [0, 0],
  ];
  const keyframes: OilSlickKeyframe[] = [{ ring: ringA }, { ring: ringB }];

  it('returns keyframe A exactly at u=0', () => {
    expect(resolveKeyframeAt(keyframes, 0)).toEqual(ringA);
  });

  it('returns keyframe B exactly at u=1', () => {
    expect(resolveKeyframeAt(keyframes, 1)).toEqual(ringB);
  });

  it('interpolates the midpoint numerically at u=0.5', () => {
    const mid = resolveKeyframeAt(keyframes, 0.5);
    expect(mid[1][0]).toBeCloseTo(2, 5);
  });

  it('handles a single-keyframe list without interpolation', () => {
    expect(resolveKeyframeAt([{ ring: ringA }], 0.5)).toEqual(ringA);
  });
});

describe('resolvePolygonAtProgress', () => {
  const origin: number[][] = [
    [0, 0],
    [1, 0],
    [0, 0],
  ];
  const detection: number[][] = [
    [0, 0],
    [5, 0],
    [0, 0],
  ];
  const keyframes: OilSlickKeyframe[] = [{ ring: origin }, { ring: detection }];

  it('returns null when there are no keyframes', () => {
    expect(resolvePolygonAtProgress(null, 0.5, 'forward')).toBeNull();
    expect(resolvePolygonAtProgress([], 0.5, 'forward')).toBeNull();
  });

  it("forward: progress 0 is the origin keyframe, progress 1 is the detection keyframe (matches InvestigationTimeline's forward semantics)", () => {
    expect(resolvePolygonAtProgress(keyframes, 0, 'forward')).toEqual(origin);
    expect(resolvePolygonAtProgress(keyframes, 1, 'forward')).toEqual(detection);
  });

  it("backtrack: progress 0 is the detection keyframe, progress 1 is the origin keyframe (matches InvestigationTimeline's backtrack semantics)", () => {
    expect(resolvePolygonAtProgress(keyframes, 0, 'backtrack')).toEqual(detection);
    expect(resolvePolygonAtProgress(keyframes, 1, 'backtrack')).toEqual(origin);
  });
});

describe('distanceFromDetection', () => {
  it('forward: distance shrinks to 0 as progress approaches 1 (detection)', () => {
    expect(distanceFromDetection(0, 'forward')).toBeCloseTo(1, 10);
    expect(distanceFromDetection(0.5, 'forward')).toBeCloseTo(0.5, 10);
    expect(distanceFromDetection(1, 'forward')).toBeCloseTo(0, 10);
  });

  it('backtrack: distance grows from 0 as progress moves away from 0 (detection)', () => {
    expect(distanceFromDetection(0, 'backtrack')).toBeCloseTo(0, 10);
    expect(distanceFromDetection(0.5, 'backtrack')).toBeCloseTo(0.5, 10);
    expect(distanceFromDetection(1, 'backtrack')).toBeCloseTo(1, 10);
  });

  it('clamps out-of-range progress to [0, 1]', () => {
    expect(distanceFromDetection(-0.5, 'forward')).toBeCloseTo(1, 10);
    expect(distanceFromDetection(1.5, 'forward')).toBeCloseTo(0, 10);
    expect(distanceFromDetection(-0.5, 'backtrack')).toBeCloseTo(0, 10);
    expect(distanceFromDetection(1.5, 'backtrack')).toBeCloseTo(1, 10);
  });
});

describe('detectionHandoffOpacity', () => {
  // Progress values expressed relative to the real, exported threshold so
  // these tests keep discriminating correctly if DETECTION_HANDOFF_THRESHOLD
  // is ever retuned.
  const forwardAtThresholdEdge = 1 - DETECTION_HANDOFF_THRESHOLD;
  const backtrackAtThresholdEdge = DETECTION_HANDOFF_THRESHOLD;

  it('is exactly 0 right at the detection point, both directions', () => {
    expect(detectionHandoffOpacity(1, 'forward')).toBe(0);
    expect(detectionHandoffOpacity(0, 'backtrack')).toBe(0);
  });

  it('is exactly 1 at the threshold boundary (inclusive), both directions', () => {
    expect(detectionHandoffOpacity(forwardAtThresholdEdge, 'forward')).toBeCloseTo(1, 10);
    expect(detectionHandoffOpacity(backtrackAtThresholdEdge, 'backtrack')).toBeCloseTo(1, 10);
  });

  it('is exactly 1 just past the threshold (outside the handoff window), both directions', () => {
    const justPastForward = forwardAtThresholdEdge - 0.01;
    const justPastBacktrack = backtrackAtThresholdEdge + 0.01;
    expect(detectionHandoffOpacity(justPastForward, 'forward')).toBe(1);
    expect(detectionHandoffOpacity(justPastBacktrack, 'backtrack')).toBe(1);
  });

  it('is exactly 1 at the midpoint (0.5) and far end (1/0) of the trajectory — well outside the handoff window', () => {
    expect(detectionHandoffOpacity(0.5, 'forward')).toBe(1);
    expect(detectionHandoffOpacity(0.5, 'backtrack')).toBe(1);
    expect(detectionHandoffOpacity(0, 'forward')).toBe(1); // forward origin: far from detection
    expect(detectionHandoffOpacity(1, 'backtrack')).toBe(1); // backtrack origin: far from detection
  });

  it('eases smoothly (not linearly) inside the window and is exactly 0.5 at the window midpoint (smoothstep symmetry)', () => {
    const forwardMid = 1 - DETECTION_HANDOFF_THRESHOLD / 2;
    const backtrackMid = DETECTION_HANDOFF_THRESHOLD / 2;
    expect(detectionHandoffOpacity(forwardMid, 'forward')).toBeCloseTo(0.5, 10);
    expect(detectionHandoffOpacity(backtrackMid, 'backtrack')).toBeCloseTo(0.5, 10);
  });

  it('forward: opacity is monotonically non-increasing as progress advances toward detection (progress 1)', () => {
    let prev = Infinity;
    for (let p = 0; p <= 1; p += 0.02) {
      const opacity = detectionHandoffOpacity(p, 'forward');
      expect(opacity).toBeLessThanOrEqual(prev + 1e-9);
      prev = opacity;
    }
  });

  it('backtrack: opacity is monotonically non-decreasing as progress advances away from detection (progress 0)', () => {
    let prev = -Infinity;
    for (let p = 0; p <= 1; p += 0.02) {
      const opacity = detectionHandoffOpacity(p, 'backtrack');
      expect(opacity).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = opacity;
    }
  });

  it('never returns a value outside [0, 1]', () => {
    for (let p = -0.2; p <= 1.2; p += 0.05) {
      expect(detectionHandoffOpacity(p, 'forward')).toBeGreaterThanOrEqual(0);
      expect(detectionHandoffOpacity(p, 'forward')).toBeLessThanOrEqual(1);
      expect(detectionHandoffOpacity(p, 'backtrack')).toBeGreaterThanOrEqual(0);
      expect(detectionHandoffOpacity(p, 'backtrack')).toBeLessThanOrEqual(1);
    }
  });

  it('confirms backtrack literally starts already invisible at progress=0 (requirement: no special-casing needed)', () => {
    // Backtrack's progress=0 IS the detection point, so this falls straight
    // out of distanceFromDetection(0, 'backtrack') === 0 — verified directly
    // here rather than just asserted.
    expect(distanceFromDetection(0, 'backtrack')).toBe(0);
    expect(detectionHandoffOpacity(0, 'backtrack')).toBe(0);
  });
});
