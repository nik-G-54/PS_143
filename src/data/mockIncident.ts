import { IncidentInfo, TimelineEvent } from '../types/incident';

export const mockIncident: IncidentInfo = {
  id: 'OS-001',
  status: 'UNDER INVESTIGATION',
  detectedAt: '26 AUG 2026 08:30 UTC',
  location: {
    name: 'Bay of Bengal',
    lat: 13.18,
    lng: 80.32,
  },
  confidence: 91,
  vessel: {
    id: 'V-01',
    name: 'MT Example',
    type: 'TANKER',
    imo: 'IMO1234567',
  },
  environment: {
    wind: {
      direction: 120,
      speed: 14,
    },
    current: {
      direction: 105,
      speed: 1.8,
    },
  },
};

export const mockTimeline: TimelineEvent[] = [
  { label: 'T-30m', time: '08:00' },
  { label: 'T-15m', time: '08:15' },
  { label: 'SPILL DETECTED', time: '08:30', isIncident: true },
  { label: 'T+6h', time: '14:30' },
  { label: 'T+12h', time: '20:30' },
  { label: 'T+24h', time: '08:30 (+1d)' },
];
