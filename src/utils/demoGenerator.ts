import { TrajectoryPoint, AISTrackPoint, SpillObservation, SpillSourceEstimate } from '../types/api';

// Simple deterministic pseudo-random generator
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const generateDemoEnvironment = (lat: number, lng: number) => {
  const seed = lat + lng;
  return {
    wind: {
      speed: 10 + seededRandom(seed) * 15, // 10 to 25
      direction: seededRandom(seed + 1) * 360
    },
    current: {
      speed: 0.5 + seededRandom(seed + 2) * 1.5, // 0.5 to 2.0
      direction: seededRandom(seed + 3) * 360
    }
  };
};

export const generateDemoTrajectory = (
  source: SpillSourceEstimate,
  observation: SpillObservation,
  estimatedReleaseTime: string,
  detectedTime: string
): TrajectoryPoint[] => {
  const startMs = Date.parse(estimatedReleaseTime);
  const endMs = Date.parse(detectedTime);
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return [];

  const points: TrajectoryPoint[] = [];
  const numSteps = 10;
  const timeStep = (endMs - startMs) / numSteps;

  const latDiff = observation.latitude - source.latitude;
  const lngDiff = observation.longitude - source.longitude;
  
  // Deterministic curvature base on coordinates
  const curveFactor = (seededRandom(source.latitude + observation.latitude) - 0.5) * 0.2;

  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const currentMs = startMs + timeStep * i;
    
    // Add some curvature using sine
    const curveOffsetLat = Math.sin(t * Math.PI) * curveFactor * lngDiff;
    const curveOffsetLng = -Math.sin(t * Math.PI) * curveFactor * latDiff;

    points.push({
      timestamp: new Date(currentMs).toISOString(),
      latitude: source.latitude + latDiff * t + curveOffsetLat,
      longitude: source.longitude + lngDiff * t + curveOffsetLng,
    });
  }

  return points;
};

export const generateDemoAISTrack = (
  source: SpillSourceEstimate,
  observation: SpillObservation,
  estimatedReleaseTime: string,
  detectedTime: string,
  seedStr: string,
  rank: number,
  distanceKm: number
): AISTrackPoint[] => {
  const startMs = Date.parse(estimatedReleaseTime);
  const endMs = Date.parse(detectedTime);
  
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return [];

  const seed = seedStr.charCodeAt(0) + rank * 10 || 1;
  
  // Calculate spatial offset based on distance and rank
  // 1 degree ~ 111 km.
  const distanceDeg = distanceKm / 111.0;
  
  // We want ships to be scattered around, passing near the area but NOT colliding with the source
  // Top candidates (rank 1) get closer.
  const angle = seededRandom(seed) * Math.PI * 2;
  const closestDistDeg = distanceDeg > 0 ? distanceDeg : (rank * 2 / 111.0);
  
  const midLat = source.latitude + Math.cos(angle) * closestDistDeg;
  const midLng = source.longitude + Math.sin(angle) * closestDistDeg;

  // A vector for the ship's path
  const pathAngle = angle + Math.PI / 2 + (seededRandom(seed + 1) - 0.5);
  const pathLen = 0.5 + seededRandom(seed + 2) * 0.5; // length of path in degrees

  const startLat = midLat - Math.cos(pathAngle) * pathLen;
  const startLng = midLng - Math.sin(pathAngle) * pathLen;

  const endLat = midLat + Math.cos(pathAngle) * pathLen;
  const endLng = midLng + Math.sin(pathAngle) * pathLen;

  // Independent time window
  // e.g. a window of 3-5 hours somewhere in the simulation bounds
  const durationMs = endMs - startMs;
  const trackDuration = durationMs * (0.3 + seededRandom(seed + 3) * 0.4);
  const trackStartOffset = seededRandom(seed + 4) * (durationMs - trackDuration);
  
  const trackStartMs = startMs + trackStartOffset;
  const trackEndMs = trackStartMs + trackDuration;

  const points: AISTrackPoint[] = [];
  const numSteps = 15;
  const timeStep = (trackEndMs - trackStartMs) / numSteps;

  for (let i = 0; i <= numSteps; i++) {
    const currentMs = trackStartMs + timeStep * i;
    const t = i / numSteps;

    const lat = startLat + (endLat - startLat) * t;
    const lng = startLng + (endLng - startLng) * t;

    let heading = pathAngle * (180 / Math.PI);
    if (heading < 0) heading += 360;

    points.push({
      timestamp: new Date(currentMs).toISOString(),
      latitude: lat,
      longitude: lng,
      heading: heading
    });
  }

  return points;
};