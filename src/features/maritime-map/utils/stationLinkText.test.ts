import { describe, expect, it } from 'vitest';
import {
  KM_PER_NM,
  LINK_TOOLTIP_NOTE,
  LINK_TOOLTIP_TITLE,
  buildLinkLabel,
  buildLinkTooltip,
  formatDistanceShort,
  formatKmAndNm,
  kmToNm,
} from './stationLinkText';

describe('distance formatting', () => {
  it('converts km to nautical miles exactly (1 nm = 1.852 km)', () => {
    expect(KM_PER_NM).toBe(1.852);
    expect(kmToNm(1.852)).toBeCloseTo(1, 10);
    expect(kmToNm(185.2)).toBeCloseTo(100, 10);
  });

  it('formats the short label form: 1 decimal under 10 km, whole km above', () => {
    expect(formatDistanceShort(5.64)).toBe('5.6 km');
    expect(formatDistanceShort(42)).toBe('42 km');
    expect(formatDistanceShort(20.6)).toBe('21 km');
    expect(formatDistanceShort(0)).toBe('0.0 km');
  });

  it('formats km and nm together to one decimal', () => {
    expect(formatKmAndNm(20.6)).toBe('20.6 km · 11.1 nm');
    expect(formatKmAndNm(42)).toBe('42.0 km · 22.7 nm');
  });

  it('shows an em dash for missing or invalid distances instead of a number', () => {
    for (const bad of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -3]) {
      expect(formatDistanceShort(bad)).toBe('—');
      expect(formatKmAndNm(bad)).toBe('—');
    }
  });
});

describe('link label and tooltip', () => {
  it('builds the midpoint label', () => {
    expect(buildLinkLabel(42)).toBe('NEAREST COAST GUARD · 42 km');
    expect(buildLinkLabel(null)).toBe('NEAREST COAST GUARD · —');
  });

  it('explains the line: station, organisation, both units, and the purpose note', () => {
    const t = buildLinkTooltip({ name: 'Hora Sfakion Port Station', organisation: 'Hellenic Coast Guard' }, 20.6);
    expect(t.title).toBe(LINK_TOOLTIP_TITLE);
    expect(t.title).toBe('Nearest coast guard station');
    expect(t.rows).toEqual([
      { label: 'Station', value: 'Hora Sfakion Port Station' },
      { label: 'Organisation', value: 'Hellenic Coast Guard' },
      { label: 'Distance', value: '20.6 km · 11.1 nm' },
    ]);
    expect(t.note).toBe(LINK_TOOLTIP_NOTE);
    expect(t.note).toMatch(/Who would receive an alert/);
    expect(t.note).toMatch(/great-circle/);
    expect(t.note).toMatch(/not a sailing route/);
  });

  it('never invents values for a station with empty fields', () => {
    const t = buildLinkTooltip({ name: '', organisation: '' }, undefined);
    expect(t.rows.map((r) => r.value)).toEqual(['—', '—', '—']);
  });
});
