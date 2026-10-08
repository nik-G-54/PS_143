import { describe, expect, it } from 'vitest';
import type { MapSpill } from '../types/spillTypes';
import type { AttributedVessel, SpillAttribution } from '../types/attributionTypes';
import type { NearestStation } from '../types/alertTypes';
import {
  DRILL_BANNER,
  EM_DASH,
  buildAlertBody,
  buildAlertDetails,
  buildEmailParams,
  buildMailtoUrl,
} from './alertDetails';

const spill: MapSpill = {
  spillId: 'spill_1',
  detectedAt: '2024-05-01T10:00:00Z',
  detectedAtMs: Date.parse('2024-05-01T10:00:00Z'),
  longitude: 14.5,
  latitude: 35.25,
  areaKm2: 1.234,
  confidenceScore: 0.87,
  candidateCount: 3,
  imageUrl: null,
  sourceType: null,
  estimatedAgeHours: null,
  estimatedReleaseTime: null,
  polygon: null,
  estimatedSourceLatitude: null,
  estimatedSourceLongitude: null,
  estimatedSourceRadiusKm: null,
  rankedTopVessel: null,
  rankedTopScore: null,
};

const nearest: NearestStation = {
  station: {
    id: 'S1',
    name: 'Test Station',
    organisation: 'Test Coast Guard',
    country: 'XX',
    lat: 35,
    lon: 14,
    source_url: 'https://example.test',
  },
  distanceKm: 55.04,
};

const vessel = (overrides: Partial<AttributedVessel>): AttributedVessel =>
  ({
    vesselId: 'v1',
    isMock: false,
    identifiersSynthetic: false,
    rank: 1,
    score: 0.91,
    vesselName: 'MV Example',
    ...overrides,
  }) as AttributedVessel;

const attribution = (vessels: AttributedVessel[], qualification: string | null): SpillAttribution =>
  ({
    spillId: 'spill_1',
    topVesselId: null,
    candidateCount: vessels.length,
    vessels,
    drawableVessels: vessels,
    bounds: null,
    withinBacktrackRadius: null,
    candidateWithinCorridor: null,
    attributionQualification: qualification,
    searchParameters: null,
  }) satisfies SpillAttribution;

const valueOf = (rows: { label: string; value: string }[], label: string) =>
  rows.find((r) => r.label === label)?.value;

describe('buildAlertDetails', () => {
  it('shows "—" for every field with no data, and invents nothing', () => {
    const bare: MapSpill = { ...spill, areaKm2: null, confidenceScore: null, detectedAt: '', detectedAtMs: null };
    const { rows, stationId } = buildAlertDetails({
      spill: bare,
      nearest: null,
      assessment: null,
      attribution: null,
    });

    expect(stationId).toBeNull();
    for (const label of [
      'Nearest station',
      'Organisation',
      'Straight-line distance',
      'Area',
      'Detection confidence',
      'Detected',
      'Coastal severity',
      'Coastal ETA',
      'Top candidate vessel',
      'Attribution qualification',
    ]) {
      expect(valueOf(rows, label), label).toBe(EM_DASH);
    }
    expect(valueOf(rows, 'Spill ID')).toBe('spill_1');
  });

  it('fills station, severity, ETA, vessel and qualification when present', () => {
    const { rows, stationId } = buildAlertDetails({
      spill,
      nearest,
      assessment: { severity: 'watch', distanceToCoastKm: 10, etaHours: 5.26, speedKnots: 1 },
      attribution: attribution([vessel({})], 'Consistent with a transit through the corridor.'),
    });

    expect(stationId).toBe('S1');
    expect(valueOf(rows, 'Nearest station')).toBe('Test Station');
    expect(valueOf(rows, 'Straight-line distance')).toBe('55.0 km');
    expect(valueOf(rows, 'Coastal severity')).toBe('Watch');
    expect(valueOf(rows, 'Coastal ETA')).toBe('~5.3 h');
    expect(valueOf(rows, 'Top candidate vessel')).toBe('MV Example · match score 91%');
    expect(valueOf(rows, 'Attribution qualification')).toBe(
      'Consistent with a transit through the corridor.'
    );
  });

  it('skips mock vessels and flags synthetic identifiers', () => {
    const { rows } = buildAlertDetails({
      spill,
      nearest,
      assessment: null,
      attribution: attribution(
        [vessel({ vesselId: 'm', isMock: true, vesselName: 'MOCK' }), vessel({ identifiersSynthetic: true })],
        null
      ),
    });
    expect(valueOf(rows, 'Top candidate vessel')).toBe('MV Example · match score 91% · synthetic identifiers');
  });

  it('distinguishes a stalled drift from missing data', () => {
    const { rows } = buildAlertDetails({
      spill,
      nearest,
      assessment: { severity: 'monitor', distanceToCoastKm: 10, etaHours: null, speedKnots: 0 },
      attribution: null,
    });
    expect(valueOf(rows, 'Coastal ETA')).toMatch(/stalled/);
    expect(valueOf(rows, 'Coastal severity')).toBe('Monitor');
  });
});

describe('alert content channels', () => {
  const details = buildAlertDetails({ spill, nearest, assessment: null, attribution: null });

  it('carries the drill banner in the body and the email params', () => {
    expect(buildAlertBody(details).startsWith(DRILL_BANNER)).toBe(true);
    const params = buildEmailParams(details, 'demo@example.test');
    expect(params.drill_banner).toBe(DRILL_BANNER);
    expect(params.message).toContain(DRILL_BANNER);
    expect(params.subject).toContain('[DRILL]');
  });

  it('addresses the demo inbox, never the station', () => {
    expect(buildEmailParams(details, 'demo@example.test').to_email).toBe('demo@example.test');
    expect(buildMailtoUrl(details, 'demo@example.test').startsWith('mailto:demo%40example.test?')).toBe(true);
    expect(JSON.stringify(buildEmailParams(details, 'demo@example.test'))).not.toContain('source_url');
  });

  it('url-encodes the mailto body, banner included', () => {
    const url = buildMailtoUrl(details, 'demo@example.test');
    expect(decodeURIComponent(url.split('body=')[1])).toContain(DRILL_BANNER);
  });
});
