import { describe, expect, it } from 'vitest';
import {
  TRAJECTORY_DETECTION_RGBA,
  TRAJECTORY_ORIGIN_LABEL,
  TRAJECTORY_ORIGIN_RGBA,
  buildSmoothedTrajectoryPath,
  computePathProgress,
  confidenceToOpacityScale,
  confidenceToWidthScale,
  formatDetectionLabel,
  interpolateTrajectoryColor,
  vertexWidthAt,
} from './trajectoryLineStyle';

describe('interpolateTrajectoryColor', () => {
  it('returns the exact detection colour at t=0', () => {
    expect(interpolateTrajectoryColor(0)).toEqual(TRAJECTORY_DETECTION_RGBA);
  });

  it('returns the exact origin colour at t=1', () => {
    expect(interpolateTrajectoryColor(1)).toEqual(TRAJECTORY_ORIGIN_RGBA);
  });

  it('returns a sensible midpoint at t=0.5', () => {
    const mid = interpolateTrajectoryColor(0.5);
    const expected = TRAJECTORY_DETECTION_RGBA.map((channel, i) =>
      Math.round((channel + TRAJECTORY_ORIGIN_RGBA[i]) / 2)
    );
    expect(mid).toEqual(expected);
    // Genuinely "in between" rather than snapping to either endpoint.
    expect(mid).not.toEqual(TRAJECTORY_DETECTION_RGBA);
    expect(mid).not.toEqual(TRAJECTORY_ORIGIN_RGBA);
  });

  it('clamps out-of-range t instead of extrapolating', () => {
    expect(interpolateTrajectoryColor(-5)).toEqual(TRAJECTORY_DETECTION_RGBA);
    expect(interpolateTrajectoryColor(5)).toEqual(TRAJECTORY_ORIGIN_RGBA);
  });
});

describe('confidence -> width/opacity scaling', () => {
  it('matches the documented formula at 0.5, 0.7, 0.9', () => {
    expect(confidenceToWidthScale(0.5)).toBeCloseTo(0.775, 10);
    expect(confidenceToWidthScale(0.7)).toBeCloseTo(0.865, 10);
    expect(confidenceToWidthScale(0.9)).toBeCloseTo(0.955, 10);

    expect(confidenceToOpacityScale(0.5)).toBeCloseTo(0.8, 10);
    expect(confidenceToOpacityScale(0.7)).toBeCloseTo(0.88, 10);
    expect(confidenceToOpacityScale(0.9)).toBeCloseTo(0.96, 10);
  });

  it('never produces a zero/negative width or fully-transparent opacity anywhere in 0..1', () => {
    for (let c = 0; c <= 1.0001; c += 0.05) {
      expect(confidenceToWidthScale(c)).toBeGreaterThan(0);
      expect(confidenceToOpacityScale(c)).toBeGreaterThan(0);
    }
  });

  it('is monotonically non-decreasing as confidence rises (0.5 -> 0.7 -> 0.9)', () => {
    const widths = [0.5, 0.7, 0.9].map(confidenceToWidthScale);
    const opacities = [0.5, 0.7, 0.9].map(confidenceToOpacityScale);
    expect(widths[1]).toBeGreaterThan(widths[0]);
    expect(widths[2]).toBeGreaterThan(widths[1]);
    expect(opacities[1]).toBeGreaterThan(opacities[0]);
    expect(opacities[2]).toBeGreaterThan(opacities[1]);
  });

  it('treats a missing/invalid score as full-scale (1), not the floor', () => {
    expect(confidenceToWidthScale(null)).toBe(1);
    expect(confidenceToWidthScale(undefined)).toBe(1);
    expect(confidenceToWidthScale(Number.NaN)).toBe(1);
    expect(confidenceToOpacityScale(null)).toBe(1);
  });

  it('clamps out-of-range confidence scores rather than exceeding the documented range', () => {
    expect(confidenceToWidthScale(-1)).toBeCloseTo(0.55, 10);
    expect(confidenceToWidthScale(2)).toBeCloseTo(1, 10);
    expect(confidenceToOpacityScale(-1)).toBeCloseTo(0.6, 10);
    expect(confidenceToOpacityScale(2)).toBeCloseTo(1, 10);
  });
});

describe('vertexWidthAt', () => {
  it('is thicker at detection (t=0) than at origin (t=1)', () => {
    expect(vertexWidthAt(0)).toBeGreaterThan(vertexWidthAt(1));
  });

  it('never returns a zero/negative width', () => {
    expect(vertexWidthAt(0)).toBeGreaterThan(0);
    expect(vertexWidthAt(0.5)).toBeGreaterThan(0);
    expect(vertexWidthAt(1)).toBeGreaterThan(0);
  });
});

describe('buildSmoothedTrajectoryPath', () => {
  const points = [
    { longitude: 24.0, latitude: 35.0 },
    { longitude: 24.2, latitude: 35.15 },
    { longitude: 24.5, latitude: 35.05 },
    { longitude: 24.8, latitude: 35.3 },
  ];

  it('preserves the first and last raw coordinates exactly', () => {
    const smoothed = buildSmoothedTrajectoryPath(points);
    expect(smoothed[0]).toEqual([24.0, 35.0]);
    expect(smoothed[smoothed.length - 1]).toEqual([24.8, 35.3]);
  });

  it('actually smooths: produces more vertices than the raw input', () => {
    expect(buildSmoothedTrajectoryPath(points).length).toBeGreaterThan(points.length);
  });

  it('handles the minimum 2-point trajectory without throwing', () => {
    const smoothed = buildSmoothedTrajectoryPath([points[0], points[1]]);
    expect(smoothed.length).toBeGreaterThanOrEqual(2);
    expect(smoothed[0]).toEqual([24.0, 35.0]);
    expect(smoothed[smoothed.length - 1]).toEqual([24.2, 35.15]);
  });

  it('falls back to the raw points for fewer than 2 inputs', () => {
    expect(buildSmoothedTrajectoryPath([])).toEqual([]);
    expect(buildSmoothedTrajectoryPath([{ longitude: 1, latitude: 2 }])).toEqual([[1, 2]]);
  });
});

describe('computePathProgress', () => {
  it('runs from exactly 0 to exactly 1 across a simple path', () => {
    const progress = computePathProgress([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
    expect(progress[0]).toBe(0);
    expect(progress[progress.length - 1]).toBe(1);
  });

  it('is strictly increasing for a path of distinct points', () => {
    const progress = computePathProgress([
      [0, 0],
      [1, 0],
      [1, 1],
      [3, 3],
    ]);
    for (let i = 1; i < progress.length; i += 1) {
      expect(progress[i]).toBeGreaterThan(progress[i - 1]);
    }
  });

  it('falls back to even spacing for a degenerate (all-identical) path', () => {
    expect(
      computePathProgress([
        [5, 5],
        [5, 5],
        [5, 5],
      ])
    ).toEqual([0, 0.5, 1]);
  });
});

describe('formatDetectionLabel', () => {
  it('formats a finite age to one decimal place', () => {
    expect(formatDetectionLabel(16.44)).toBe('DETECTED · T+16.4H');
    expect(formatDetectionLabel(0)).toBe('DETECTED · T+0.0H');
  });

  it('falls back to a bare label when the age is missing/invalid', () => {
    expect(formatDetectionLabel(null)).toBe('DETECTED');
    expect(formatDetectionLabel(undefined)).toBe('DETECTED');
    expect(formatDetectionLabel(Number.NaN)).toBe('DETECTED');
  });
});

describe('TRAJECTORY_ORIGIN_LABEL', () => {
  it('is the literal string ORIGIN', () => {
    expect(TRAJECTORY_ORIGIN_LABEL).toBe('ORIGIN');
  });
});
