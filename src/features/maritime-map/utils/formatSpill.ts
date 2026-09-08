import type { MapSpill } from '../types/spillTypes';

const EM_DASH = '—';

/** The backend reports in UTC and investigators compare across zones, so UTC it stays. */
const UTC_TIMESTAMP_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

/** Format an epoch-ms instant as a UTC wall clock reading. */
export function formatUtcTimestamp(timestampMs: number): string {
  return UTC_TIMESTAMP_FORMAT.format(timestampMs);
}

export function formatDetectedAt(spill: MapSpill): string {
  if (spill.detectedAtMs == null) return spill.detectedAt || EM_DASH;
  return formatUtcTimestamp(spill.detectedAtMs);
}

export function formatArea(areaKm2: number | null): string {
  if (areaKm2 == null) return EM_DASH;
  return `${areaKm2.toFixed(2)} km²`;
}

export function formatConfidence(confidenceScore: number | null): string {
  if (confidenceScore == null) return EM_DASH;
  return `${Math.round(confidenceScore * 100)}%`;
}

export function formatCandidates(candidateCount: number | null): string {
  if (candidateCount == null) return EM_DASH;
  return `${candidateCount} vessel${candidateCount === 1 ? '' : 's'}`;
}

/** Signed decimal degrees as hemisphere-suffixed coordinates. */
export function formatLatLon(longitude: number, latitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lon}`;
}

export function formatCoordinates(spill: MapSpill): string {
  return formatLatLon(spill.longitude, spill.latitude);
}
