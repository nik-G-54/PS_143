import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseStations } from './stationsConfig';

/** Pixel width from a JPEG's start-of-frame marker; Infinity when it can't be read (so the test fails loudly). */
function jpegWidth(buf: Buffer): number {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return buf.readUInt16BE(i + 7);
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return Number.POSITIVE_INFINITY;
}

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

  it('ships only attributed, local, licensed photos that exist on disk', () => {
    const rawPhotoCount = (raw as { photo?: string }[]).filter((r) => r.photo).length;
    const withPhoto = stations.filter((s) => s.photo);
    // The validator drops a photo that lacks attribution — none of the shipped ones may be dropped.
    expect(withPhoto).toHaveLength(rawPhotoCount);
    expect(withPhoto.length).toBeGreaterThan(0);

    for (const s of withPhoto) {
      expect(existsSync(resolve(process.cwd(), 'public', s.photo!)), `${s.id}: ${s.photo}`).toBe(true);
      expect(s.photo_author, s.id).toBeTruthy();
      expect(s.photo_license, s.id).toMatch(/^(CC0|CC BY(-SA)? \d\.\d|Public domain)/);
      expect(s.photo_source_url, s.id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(s.photo_caption, `${s.id}: say what the picture shows`).toBeTruthy();
    }
  });

  it('keeps photos small enough to bundle (≤ 800px wide, under 400 KB)', () => {
    for (const s of stations.filter((x) => x.photo)) {
      const buf = readFileSync(resolve(process.cwd(), 'public', s.photo!));
      expect(buf.length, s.id).toBeLessThan(400 * 1024);
      expect(jpegWidth(buf), `${s.id}: width`).toBeLessThanOrEqual(800);
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

  describe('photo fields', () => {
    const photo = {
      photo: 'data/station-photos/s1.jpg',
      photo_caption: 'Harbour at S1 (not the station building)',
      photo_author: 'A. Photographer',
      photo_license: 'CC BY-SA 4.0',
      photo_source_url: 'https://commons.wikimedia.org/wiki/File:S1.jpg',
    };

    it('loads a station without any photo fields', () => {
      const [s] = parseStations([valid]);
      expect(s).not.toHaveProperty('photo');
      expect(s).not.toHaveProperty('photo_author');
    });

    it('keeps a fully attributed local photo', () => {
      expect(parseStations([{ ...valid, ...photo }])[0]).toMatchObject(photo);
    });

    it('drops the whole photo when attribution is missing', () => {
      for (const missing of ['photo_author', 'photo_license', 'photo_source_url'] as const) {
        const [s] = parseStations([{ ...valid, ...photo, [missing]: '' }]);
        expect(s, missing).not.toHaveProperty('photo');
        expect(s, missing).not.toHaveProperty('photo_caption');
        expect(s.id).toBe('S1'); // the station itself still loads
      }
    });

    it('refuses a hotlinked or path-escaping photo', () => {
      for (const bad of ['https://upload.wikimedia.org/x.jpg', '/data/station-photos/s1.jpg', 'data/station-photos/../../secret.jpg', 'other/s1.jpg']) {
        expect(parseStations([{ ...valid, ...photo, photo: bad }])[0], bad).not.toHaveProperty('photo');
      }
    });

    it('requires an https source page', () => {
      expect(parseStations([{ ...valid, ...photo, photo_source_url: 'javascript:alert(1)' }])[0]).not.toHaveProperty('photo');
    });
  });

  it('returns an empty list for a non-array payload', () => {
    expect(parseStations({ stations: [valid] })).toEqual([]);
    expect(parseStations(null)).toEqual([]);
  });
});
