import { describe, expect, it } from 'vitest';
import { scaledProgressDelta } from './useInvestigationTimeline';

describe('scaledProgressDelta', () => {
  const durationMs = 12_000;

  it('matches the unscaled (1x) increment: deltaMs / durationMs', () => {
    expect(scaledProgressDelta(1_000, durationMs, 1)).toBeCloseTo(1_000 / durationMs, 10);
  });

  it('scales the increment linearly with speed at 0.25x', () => {
    const base = scaledProgressDelta(1_000, durationMs, 1);
    const quarter = scaledProgressDelta(1_000, durationMs, 0.25);
    expect(quarter).toBeCloseTo(base * 0.25, 10);
  });

  it('scales the increment linearly with speed at 0.5x', () => {
    const base = scaledProgressDelta(1_000, durationMs, 1);
    const half = scaledProgressDelta(1_000, durationMs, 0.5);
    expect(half).toBeCloseTo(base * 0.5, 10);
  });

  it('scales the increment linearly with speed at 1.5x', () => {
    const base = scaledProgressDelta(1_000, durationMs, 1);
    const oneAndHalf = scaledProgressDelta(1_000, durationMs, 1.5);
    expect(oneAndHalf).toBeCloseTo(base * 1.5, 10);
  });

  it('scales the increment linearly with speed at 2x', () => {
    const base = scaledProgressDelta(1_000, durationMs, 1);
    const double = scaledProgressDelta(1_000, durationMs, 2);
    expect(double).toBeCloseTo(base * 2, 10);
  });

  it('models nextProgress = progress + baseIncrement * speed across a short playback sequence', () => {
    const baseIncrement = 1_000 / durationMs;
    let progressAt1x = 0;
    let progressAt2x = 0;
    for (let i = 0; i < 5; i += 1) {
      progressAt1x += scaledProgressDelta(1_000, durationMs, 1);
      progressAt2x += scaledProgressDelta(1_000, durationMs, 2);
    }
    expect(progressAt1x).toBeCloseTo(baseIncrement * 5, 10);
    expect(progressAt2x).toBeCloseTo(baseIncrement * 5 * 2, 10);
    // 2x covers exactly double the ground of 1x for the same wall-clock ticks.
    expect(progressAt2x).toBeCloseTo(progressAt1x * 2, 10);
  });

  it('returns 0 for a non-positive or non-finite delta (guards the first tick where last==now)', () => {
    expect(scaledProgressDelta(0, durationMs, 1)).toBe(0);
    expect(scaledProgressDelta(-5, durationMs, 1)).toBe(0);
    expect(scaledProgressDelta(NaN, durationMs, 1)).toBe(0);
  });
});
