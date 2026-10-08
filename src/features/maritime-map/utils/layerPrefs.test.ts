import { describe, expect, it } from 'vitest';
import { NEAREST_COAST_GUARD_PREF, readBooleanPref, writeBooleanPref } from './layerPrefs';

const memory = (initial?: Record<string, string>) => {
  const data = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
};

describe('layer preference', () => {
  it('defaults to ON for the nearest-coast-guard layer when nothing is stored', () => {
    expect(readBooleanPref(NEAREST_COAST_GUARD_PREF, true, memory())).toBe(true);
  });

  it('remembers a toggle across reads', () => {
    const storage = memory();
    writeBooleanPref(NEAREST_COAST_GUARD_PREF, false, storage);
    expect(readBooleanPref(NEAREST_COAST_GUARD_PREF, true, storage)).toBe(false);
    writeBooleanPref(NEAREST_COAST_GUARD_PREF, true, storage);
    expect(readBooleanPref(NEAREST_COAST_GUARD_PREF, true, storage)).toBe(true);
  });

  it('falls back to the default for corrupt values', () => {
    expect(readBooleanPref('k', true, memory({ k: 'maybe' }))).toBe(true);
    expect(readBooleanPref('k', false, memory({ k: '' }))).toBe(false);
  });

  it('never throws when storage is blocked, and reads the default', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(readBooleanPref('k', true, blocked)).toBe(true);
    expect(() => writeBooleanPref('k', false, blocked)).not.toThrow();
    expect(readBooleanPref('k', true, null)).toBe(true);
    expect(() => writeBooleanPref('k', false, null)).not.toThrow();
  });
});
