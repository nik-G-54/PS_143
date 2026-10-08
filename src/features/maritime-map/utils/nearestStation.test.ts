import { describe, expect, it } from 'vitest';
import type { CoastGuardStation } from '../types/alertTypes';
import { findNearestStation } from './nearestStation';

const station = (id: string, lat: number, lon: number): CoastGuardStation => ({
  id,
  name: `Station ${id}`,
  organisation: 'Test Org',
  country: 'XX',
  lat,
  lon,
  source_url: 'https://example.test',
});

describe('findNearestStation', () => {
  const near = station('near', 35.1, 14.1);
  const far = station('far', 40, 20);

  it('picks the closest station regardless of list order', () => {
    expect(findNearestStation(35, 14, [far, near])?.station.id).toBe('near');
    expect(findNearestStation(35, 14, [near, far])?.station.id).toBe('near');
  });

  it('returns a great-circle distance in km', () => {
    // One degree of latitude is ~111.2 km.
    const result = findNearestStation(35, 14, [station('a', 36, 14)]);
    expect(result?.distanceKm).toBeGreaterThan(110);
    expect(result?.distanceKm).toBeLessThan(112.5);
  });

  it('returns null for an empty station list', () => {
    expect(findNearestStation(35, 14, [])).toBeNull();
  });

  it('returns null when the spill coordinates are null, undefined or non-finite', () => {
    expect(findNearestStation(null, 14, [near])).toBeNull();
    expect(findNearestStation(35, null, [near])).toBeNull();
    expect(findNearestStation(undefined, undefined, [near])).toBeNull();
    expect(findNearestStation(Number.NaN, 14, [near])).toBeNull();
  });

  it('skips stations with unusable coordinates instead of ranking them', () => {
    const broken = { ...station('broken', Number.NaN, 14) };
    expect(findNearestStation(35, 14, [broken, far])?.station.id).toBe('far');
    expect(findNearestStation(35, 14, [broken])).toBeNull();
  });

  it('keeps the earlier station on an exact tie', () => {
    const a = station('a', 36, 14);
    const b = station('b', 36, 14);
    expect(findNearestStation(35, 14, [a, b])?.station.id).toBe('a');
  });
});
