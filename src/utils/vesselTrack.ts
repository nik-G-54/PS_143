import { AISTrackPoint } from '../types/api';

export interface ResolvedVesselPosition {
  latitude: number;
  longitude: number;
  heading: number;
}

function getBearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function getPointRotation(pt: AISTrackPoint): number | null {
  if (typeof pt.heading === 'number' && pt.heading !== null) return pt.heading;
  if (typeof pt.course === 'number' && pt.course !== null) return pt.course;
  return null;
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
      heading: getPointRotation(validPoints[0]) ?? 0
    };
  }

  // Ensure chronological order for interpolation
  const sortedPoints = [...validPoints].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  const currentTimeMs = direction === 'FORWARD'
    ? startTimeMs + progress * (endTimeMs - startTimeMs)
    : endTimeMs - progress * (endTimeMs - startTimeMs);

  const firstPtTime = Date.parse(sortedPoints[0].timestamp);
  const lastPtTime = Date.parse(sortedPoints[sortedPoints.length - 1].timestamp);

  if (currentTimeMs <= firstPtTime) {
    const pt = sortedPoints[0];
    let heading = getPointRotation(pt);
    if (heading === null) {
      heading = getBearingDegrees(pt.latitude, pt.longitude, sortedPoints[1].latitude, sortedPoints[1].longitude);
    }
    return { latitude: pt.latitude, longitude: pt.longitude, heading };
  }

  if (currentTimeMs >= lastPtTime) {
    const pt = sortedPoints[sortedPoints.length - 1];
    let heading = getPointRotation(pt);
    if (heading === null) {
      const prevPt = sortedPoints[sortedPoints.length - 2];
      heading = getBearingDegrees(prevPt.latitude, prevPt.longitude, pt.latitude, pt.longitude);
    }
    return { latitude: pt.latitude, longitude: pt.longitude, heading };
  }

  let beforePt = sortedPoints[0];
  let afterPt = sortedPoints[sortedPoints.length - 1];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const ptTime = Date.parse(sortedPoints[i].timestamp);
    const nextPtTime = Date.parse(sortedPoints[i + 1].timestamp);
    
    if (currentTimeMs >= ptTime && currentTimeMs <= nextPtTime) {
      beforePt = sortedPoints[i];
      afterPt = sortedPoints[i + 1];
      break;
    }
  }

  const t1 = Date.parse(beforePt.timestamp);
  const t2 = Date.parse(afterPt.timestamp);

  if (t1 === t2) {
    let heading = getPointRotation(beforePt);
    if (heading === null) heading = 0;
    return { latitude: beforePt.latitude, longitude: beforePt.longitude, heading };
  }

  const t = (currentTimeMs - t1) / (t2 - t1);
  const lat = beforePt.latitude + (afterPt.latitude - beforePt.latitude) * t;
  const lon = beforePt.longitude + (afterPt.longitude - beforePt.longitude) * t;
  
  let h1 = getPointRotation(beforePt);
  let h2 = getPointRotation(afterPt);

  if (h1 === null || h2 === null) {
    const bearing = getBearingDegrees(beforePt.latitude, beforePt.longitude, afterPt.latitude, afterPt.longitude);
    if (h1 === null) h1 = bearing;
    if (h2 === null) h2 = bearing;
  }

  // Handle wrap-around for heading interpolation
  let diff = h2 - h1;
  if (diff > 180) h2 -= 360;
  if (diff < -180) h2 += 360;
  
  let heading = h1 + (h2 - h1) * t;
  heading = (heading + 360) % 360;

  return { latitude: lat, longitude: lon, heading };
}