import { TrajectoryPoint } from '../types/api';

export interface ResolvedPosition {
  latitude: number;
  longitude: number;
}

/**
 * Resolves the interpolated geographic position of the oil based on the simulation time.
 * @param trajectory The backend-provided array of trajectory points
 * @param progress A number from 0 to 1 representing the simulation progress
 * @param startTimeMs The timestamp (in ms) of the beginning of the simulation (e.g. estimated_release_time)
 * @param endTimeMs The timestamp (in ms) of the end of the simulation (e.g. observation.timestamp)
 */
export function resolveTrajectoryPosition(
  trajectory: TrajectoryPoint[],
  progress: number,
  startTimeMs: number,
  endTimeMs: number
): ResolvedPosition | null {
  if (!trajectory || trajectory.length === 0) return null;

  // Filter out invalid points
  const validPoints = trajectory.filter(
    (pt) => typeof pt.latitude === 'number' && typeof pt.longitude === 'number' && !isNaN(Date.parse(pt.timestamp))
  );

  if (validPoints.length === 0) return null;
  if (validPoints.length === 1) {
    return { latitude: validPoints[0].latitude, longitude: validPoints[0].longitude };
  }

  // Calculate current simulation time in ms
  const currentTimeMs = startTimeMs + progress * (endTimeMs - startTimeMs);

  // Get the chronological start and end of the trajectory array, assuming it's ordered in some direction
  const firstPtTime = Date.parse(validPoints[0].timestamp);
  const lastPtTime = Date.parse(validPoints[validPoints.length - 1].timestamp);
  const chronologicalStart = Math.min(firstPtTime, lastPtTime);
  const chronologicalEnd = Math.max(firstPtTime, lastPtTime);

  // Case 4: Current time before the chronological start of the trajectory
  if (currentTimeMs <= chronologicalStart) {
    const pt = firstPtTime === chronologicalStart ? validPoints[0] : validPoints[validPoints.length - 1];
    return { latitude: pt.latitude, longitude: pt.longitude };
  }

  // Case 5: Current time after the chronological end of the trajectory
  if (currentTimeMs >= chronologicalEnd) {
    const pt = firstPtTime === chronologicalEnd ? validPoints[0] : validPoints[validPoints.length - 1];
    return { latitude: pt.latitude, longitude: pt.longitude };
  }

  // Find exact surrounding points
  let beforePt = validPoints[0];
  let afterPt = validPoints[validPoints.length - 1];

  for (let i = 0; i < validPoints.length - 1; i++) {
    const ptTime = Date.parse(validPoints[i].timestamp);
    const nextPtTime = Date.parse(validPoints[i + 1].timestamp);

    const minTime = Math.min(ptTime, nextPtTime);
    const maxTime = Math.max(ptTime, nextPtTime);

    // Assuming the points are ordered in time, but safely handle reverse order if the backend provides it that way
    if (currentTimeMs >= minTime && currentTimeMs <= maxTime) {
      beforePt = validPoints[i];
      afterPt = validPoints[i + 1];
      break;
    }
  }

  const t1 = Date.parse(beforePt.timestamp);
  const t2 = Date.parse(afterPt.timestamp);

  // Handle equal timestamps gracefully to avoid division by zero
  if (t1 === t2) {
    return { latitude: beforePt.latitude, longitude: beforePt.longitude };
  }

  // Linear interpolation for visual movement
  const t = (currentTimeMs - t1) / (t2 - t1);
  const lat = beforePt.latitude + (afterPt.latitude - beforePt.latitude) * t;
  const lon = beforePt.longitude + (afterPt.longitude - beforePt.longitude) * t;

  return { latitude: lat, longitude: lon };
}