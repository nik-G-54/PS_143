import { describe, expect, it } from 'vitest';
import type { SpillForecast } from '../types/forecastTypes';
import {
  computeAlertSeverity,
  computeEtaHours,
  computeForecastAlertSeverity,
  computeForecastCoastalAssessment,
  type CoastlineGeoJSON,
} from './coastalAlert';

// A north-south coast along lon 0, so a point at lon 0.1 sits ~11 km (at the equator) off it.
const coastline: CoastlineGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, -1],
          [0, 1],
        ],
      },
    },
  ],
};

function forecast(speedKnots: number | null): SpillForecast {
  return {
    spillId: 's',
    points: [
      {
        longitude: 0.1,
        latitude: 0,
        timestamp: '2024-05-01T00:00:00Z',
        timestampMs: 0,
        hoursFromNow: 0,
        cumulativeKm: 0,
        driftSpeedKnots: speedKnots,
        driftHeadingDeg: null,
      },
    ],
    predictedPosition: { longitude: 0.1, latitude: 0 },
    bounds: { minLon: 0, minLat: 0, maxLon: 0.1, maxLat: 0 },
    totalDisplacementKm: null,
    netHeadingDeg: null,
    averageSpeedKnots: null,
    durationHours: 1,
  };
}

describe('computeEtaHours', () => {
  it('is distance over speed, in hours', () => {
    expect(computeEtaHours(18.52, 1)).toBeCloseTo(10, 6); // 1 kn = 1.852 km/h
  });

  it('is null when the drift is effectively stationary', () => {
    expect(computeEtaHours(10, 0)).toBeNull();
    expect(computeEtaHours(10, 0.04)).toBeNull();
  });
});

describe('computeAlertSeverity', () => {
  it('keeps its ETA thresholds', () => {
    expect(computeAlertSeverity(1.852 * 2, 1)).toBe('critical'); // 2 h
    expect(computeAlertSeverity(1.852 * 6, 1)).toBe('watch'); // 6 h
    expect(computeAlertSeverity(1.852 * 20, 1)).toBe('advisory'); // 20 h
    expect(computeAlertSeverity(1, 0)).toBe('monitor');
  });
});

describe('computeForecastCoastalAssessment', () => {
  it('returns null without a forecast or coastline', () => {
    expect(computeForecastCoastalAssessment(null, coastline)).toBeNull();
    expect(computeForecastCoastalAssessment(forecast(1), null)).toBeNull();
  });

  it('exposes the distance and ETA behind the severity', () => {
    const result = computeForecastCoastalAssessment(forecast(1), coastline);
    expect(result?.distanceToCoastKm).toBeGreaterThan(10);
    expect(result?.distanceToCoastKm).toBeLessThan(12);
    expect(result?.etaHours).toBeCloseTo((result?.distanceToCoastKm ?? 0) / 1.852, 6);
    expect(result?.severity).toBe(computeForecastAlertSeverity(forecast(1), coastline));
  });

  it('reports a null ETA and "monitor" for a stalled drift', () => {
    const result = computeForecastCoastalAssessment(forecast(0), coastline);
    expect(result).toMatchObject({ severity: 'monitor', etaHours: null });
  });
});
