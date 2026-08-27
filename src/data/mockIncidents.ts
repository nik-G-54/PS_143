import { Incident } from '../types/incident';

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "OS-001",
    date: "2026-08-26",
    latitude: 36.8,
    longitude: 15.5,
    locationName: "Sicily Channel, Mediterranean",
    status: "ACTIVE",
    confidence: 87,
    vesselInvolved: "MT Mediterranean Star",
    spillArea: 12.5,
    severity: "HIGH"
  },
  {
    id: "OS-002",
    date: "2026-08-25",
    latitude: 35.2,
    longitude: 18.1,
    locationName: "East of Malta",
    status: "INVESTIGATING",
    confidence: 92,
    vesselInvolved: "MV Aegean Voyager",
    spillArea: 5.2,
    severity: "MEDIUM"
  },
  {
    id: "OS-003",
    date: "2026-08-24",
    latitude: 38.0,
    longitude: 10.5,
    locationName: "Sardinia Channel",
    status: "RESOLVED",
    confidence: 78,
    vesselInvolved: "Unknown",
    spillArea: 2.1,
    severity: "LOW"
  },
  {
    id: "OS-004",
    date: "2026-08-23",
    latitude: 33.5,
    longitude: 32.0,
    locationName: "East Mediterranean, Near Cyprus",
    status: "ACTIVE",
    confidence: 95,
    vesselInvolved: "Gulf Carrier",
    spillArea: 18.3,
    severity: "CRITICAL"
  },
  {
    id: "OS-005",
    date: "2026-08-22",
    latitude: 41.0,
    longitude: 15.5,
    locationName: "Adriatic Sea, Italy",
    status: "INVESTIGATING",
    confidence: 71,
    vesselInvolved: "Cape Trader",
    spillArea: 3.8,
    severity: "MEDIUM"
  }
];
