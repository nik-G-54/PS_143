import { describe, expect, it } from 'vitest';
import type { CoastGuardStation } from '../types/alertTypes';
import { buildStationLabelData } from './stationLabelData';

const station: CoastGuardStation = {
  id: 'S1',
  name: 'Hora Sfakion Port Station',
  organisation: 'Hellenic Coast Guard',
  country: 'Greece',
  lat: 35.2,
  lon: 24.1,
  source_url: 'https://example.test',
};

describe('buildStationLabelData', () => {
  const [link, stationLabel] = buildStationLabelData({ station, distanceKm: 42, midpoint: [24.07, 35.1] });

  it('pins the distance label at the midpoint', () => {
    expect(link.title).toBe('NEAREST COAST GUARD · 42 km');
    expect([link.longitude, link.latitude]).toEqual([24.07, 35.1]);
  });

  it('pins the station name at the station', () => {
    expect(stationLabel.title).toBe('Hora Sfakion Port Station');
    expect([stationLabel.longitude, stationLabel.latitude]).toEqual([24.1, 35.2]);
  });

  it('falls back to the id when a station has no name', () => {
    const [, label] = buildStationLabelData({ station: { ...station, name: '' }, distanceKm: 1, midpoint: [0, 0] });
    expect(label.title).toBe('S1');
  });
});
