const EM_DASH = '—';

/**
 * Elapsed hours, trimmed to one decimal.
 *
 * Drift windows in the archive run 16–48 h and the time ticks land on whole
 * multiples of six, so hours read naturally and a day/hour split would only add
 * arithmetic for the reader.
 */
function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded} h` : `${rounded.toFixed(1)} h`;
}

/** Total span of the backtrack window. */
export function formatDriftWindow(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return EM_DASH;
  return formatHours(hours);
}

/** A drift position's age relative to the detection. */
export function formatHoursBeforeDetection(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return 'at detection';
  return `${formatHours(hours)} earlier`;
}

/** Distance along or across the water, switching to metres below a kilometre. */
export function formatDistanceKm(km: number | null): string {
  if (km == null || !Number.isFinite(km)) return EM_DASH;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

/** The backend's origin uncertainty, signed as a tolerance rather than a distance. */
export function formatUncertaintyRadius(radiusKm: number | null): string {
  if (radiusKm == null || !Number.isFinite(radiusKm)) return EM_DASH;
  return `± ${formatDistanceKm(radiusKm)}`;
}

export function formatPositionCount(count: number): string {
  return `${count} position${count === 1 ? '' : 's'}`;
}
