import { TrajectoryPoint } from '../types/api';

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDurationHours(ms: number) {
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}

export function formatShortUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Backend timestamp → "12 Jan 11:27" for sparse trajectory markers. */
export function formatMilestoneUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export function formatOffsetLabel(hoursFromStart: number) {
  if (Math.abs(hoursFromStart) < 0.05) return 'T+0h';
  return `T+${hoursFromStart.toFixed(hoursFromStart < 10 ? 1 : 0)}h`;
}

export interface TrajectoryMilestone {
  index: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  hoursFromStart: number;
  distanceFromStartKm: number;
  label: string;
  timeLabel: string;
  isStart: boolean;
  isEnd: boolean;
}

export interface TrajectoryStats {
  points: TrajectoryPoint[];
  totalDistanceKm: number;
  durationMs: number;
  durationLabel: string;
  startMs: number;
  endMs: number;
  milestones: TrajectoryMilestone[];
}

/** Pick evenly spaced waypoints along the trajectory for timestamp labels. */
export function computeTrajectoryStats(
  trajectory: TrajectoryPoint[] | undefined,
  maxMilestones = 6
): TrajectoryStats | null {
  if (!trajectory || trajectory.length < 2) return null;

  const points = [...trajectory]
    .filter(
      (pt) =>
        typeof pt.latitude === 'number' &&
        typeof pt.longitude === 'number' &&
        !Number.isNaN(Date.parse(pt.timestamp))
    )
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  if (points.length < 2) return null;

  const startMs = Date.parse(points[0].timestamp);
  const endMs = Date.parse(points[points.length - 1].timestamp);
  const durationMs = Math.max(0, endMs - startMs);

  let totalDistanceKm = 0;
  const cumDist = [0];
  for (let i = 1; i < points.length; i++) {
    totalDistanceKm += haversineKm(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
    cumDist.push(totalDistanceKm);
  }

  const count = Math.min(maxMilestones, points.length);
  const indices = new Set<number>();
  if (count <= 1) {
    indices.add(0);
  } else {
    for (let i = 0; i < count; i++) {
      indices.add(Math.round((i / (count - 1)) * (points.length - 1)));
    }
  }

  const milestones: TrajectoryMilestone[] = [...indices]
    .sort((a, b) => a - b)
    .map((index) => {
      const pt = points[index];
      const t = Date.parse(pt.timestamp);
      const hoursFromStart = (t - startMs) / 3_600_000;
      return {
        index,
        latitude: pt.latitude,
        longitude: pt.longitude,
        timestamp: pt.timestamp,
        hoursFromStart,
        distanceFromStartKm: cumDist[index],
        label: formatOffsetLabel(hoursFromStart),
        timeLabel: formatMilestoneUtc(pt.timestamp),
        isStart: index === 0,
        isEnd: index === points.length - 1,
      };
    });

  return {
    points,
    totalDistanceKm,
    durationMs,
    durationLabel: formatDurationHours(durationMs),
    startMs,
    endMs,
    milestones,
  };
}
