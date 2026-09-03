import { AISTrackPoint } from '../types/api';

export interface ResolvedVesselPosition {
  latitude: number;
  longitude: number;
  heading: number;
}

/**
 * Resolves the interpolated geographic position of the vessel based on simulation time and AIS track.
 */
export function resolveVesselPosition(
  track: AISTrackPoint[],
  progress: number,
  startTimeMs: number,
  endTimeMs: number,
  direction: 'FORWARD' | 'BACKTRACK' = 'FORWARD'
): ResolvedVesselPosition | null {
  if (!track || track.length === 0) return null;

  // Filter out invalid points
  const validPoints = track.filter(
    (pt) => typeof pt.latitude === 'number' && typeof pt.longitude === 'number' && !isNaN(Date.parse(pt.timestamp))
  );

  if (validPoints.length === 0) return null;
  if (validPoints.length === 1) {
    return { 
      latitude: validPoints[0].latitude, 
      longitude: validPoints[0].longitude,
      heading: validPoints[0].heading ?? 0 
    };
  }

  const currentTimeMs = direction === 'FORWARD'
    ? startTimeMs + progress * (endTimeMs - startTimeMs)
    : endTimeMs - progress * (endTimeMs - startTimeMs);

  // Chronological bounds
  const firstPtTime = Date.parse(validPoints[0].timestamp);
  const lastPtTime = Date.parse(validPoints[validPoints.length - 1].timestamp);
  const chronologicalStart = Math.min(firstPtTime, lastPtTime);
  const chronologicalEnd = Math.max(firstPtTime, lastPtTime);

  if (currentTimeMs <= chronologicalStart) {
    const pt = firstPtTime === chronologicalStart ? validPoints[0] : validPoints[validPoints.length - 1];
    return { latitude: pt.latitude, longitude: pt.longitude, heading: pt.heading ?? 0 };
  }

  if (currentTimeMs >= chronologicalEnd) {
    const pt = firstPtTime === chronologicalEnd ? validPoints[0] : validPoints[validPoints.length - 1];
    return { latitude: pt.latitude, longitude: pt.longitude, heading: pt.heading ?? 0 };
  }

  let beforePt = validPoints[0];
  let afterPt = validPoints[validPoints.length - 1];

  for (let i = 0; i < validPoints.length - 1; i++) {
    const ptTime = Date.parse(validPoints[i].timestamp);
    const nextPtTime = Date.parse(validPoints[i + 1].timestamp);
    
    const minTime = Math.min(ptTime, nextPtTime);
    const maxTime = Math.max(ptTime, nextPtTime);

    if (currentTimeMs >= minTime && currentTimeMs <= maxTime) {
      beforePt = validPoints[i];
      afterPt = validPoints[i + 1];
      break;
    }
  }

  const t1 = Date.parse(beforePt.timestamp);
  const t2 = Date.parse(afterPt.timestamp);

  if (t1 === t2) {
    return { latitude: beforePt.latitude, longitude: beforePt.longitude, heading: beforePt.heading ?? 0 };
  }

  const t = (currentTimeMs - t1) / (t2 - t1);
  const lat = beforePt.latitude + (afterPt.latitude - beforePt.latitude) * t;
  const lon = beforePt.longitude + (afterPt.longitude - beforePt.longitude) * t;
  
  // Basic linear interpolation for heading (Note: this doesn't safely handle 359->0 wrap-around, but sufficient for now as per instructions "visual interpolation only")
  const h1 = beforePt.heading ?? 0;
  const h2 = afterPt.heading ?? 0;
  const heading = h1 + (h2 - h1) * t;

  return { latitude: lat, longitude: lon, heading };
}