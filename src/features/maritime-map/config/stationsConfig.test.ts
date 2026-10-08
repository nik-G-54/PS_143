import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseStations } from './stationsConfig';

describe('shipped coast-guard-stations.json', () => {
  const raw: unknown = JSON.parse(
    readFileSync(resolve(process.cwd(), 'public/data/coast-guard-stations.json'), 'utf8')
  );
  const stations = parseStations(raw);

  it('parses completely: no entry is dropped by the validator', () => {
    expect(Array.isArray(raw) && raw.length).toBeGreaterThan(0);
    expect(stations).toHaveLength((raw as unknown[]).length);
  });

  it('has no placeholder entries', () => {
    expect(JSON.stringify(raw)).not.toMatch(/placeholder/i);
    expect(new Set(stations.map((s) => s.id)).size).toBe(stations.length);
    // The two original placeholders sat at (0,0) and (1,1) in the Gulf of Guinea.
    expect(stations.every((s) => Math.abs(s.lat) > 5 && Math.abs(s.lon) > 5)).toBe(true);
  });

  it('keeps the display name and organisation in English, with the local name separate', () => {
    for (const s of stations) {
      expect(s.name, s.id).not.toMatch(/[Ͱ-Ͽἀ-῿]/); // no Greek in the display name
      expect(s.organisation, s.id).not.toMatch(/[Ͱ-Ͽἀ-῿]/);
      expect(s.name, s.id).not.toContain('(');
      expect(s.name_local, s.id).toMatch(/[Ͱ-Ͽἀ-῿]/);
    }
  });

  it('records where every station and coordinate came from', () => {
    for (const s of stations) {
      expect(s.name, s.id).not.toBe('');
      expect(s.organisation, s.id).not.toBe('');
      expect(s.source_url, s.id).toMatch(/^https:\/\//);
      expect(['official', 'openstreetmap'], s.id).toContain(s.coordinate_source);
      if (s.coordinate_source === 'openstreetmap') {
        expect(s.coordinate_source_url, s.id).toMatch(/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/);
      }
    }
  });
});

const valid = {
  id: 'S1',
  name: 'Station One',
  organisation: 'Org',
  country: 'XX',
  lat: 35,
  lon: 14,
  source_url: 'https://example.test',
};

describe('parseStations', () => {
  it('keeps well-formed entries', () => {
    expect(parseStations([valid])).toEqual([valid]);
  });

  it('drops entries without an id or with unusable coordinates', () => {
    const result = parseStations([
      valid,
      { ...valid, id: '' },
      { ...valid, id: 'bad-lat', lat: 'x' },
      { ...valid, id: 'range', lat: 91 },
      { ...valid, id: 'nan', lon: Number.NaN },
      null,
      'nope',
    ]);
    expect(result.map((s) => s.id)).toEqual(['S1']);
  });

  it('keeps valid coordinate provenance and ignores an unknown coordinate_source', () => {
    const [ok] = parseStations([
      { ...valid, coordinate_source: 'openstreetmap', coordinate_source_url: 'https://osm.test/n/1', coordinate_note: 'port-level' },
    ]);
    expect(ok).toMatchObject({
      coordinate_source: 'openstreetmap',
      coordinate_source_url: 'https://osm.test/n/1',
      coordinate_note: 'port-level',
    });
    const [bad] = parseStations([{ ...valid, coordinate_source: 'guess' }]);
    expect(bad).not.toHaveProperty('coordinate_source');
  });

  it('returns an empty list for a non-array payload', () => {
    expect(parseStations({ stations: [valid] })).toEqual([]);
    expect(parseStations(null)).toEqual([]);
  });
});
