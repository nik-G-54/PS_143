const METERS_PER_DEGREE_LAT = 111320;
export const METERS_PER_WORLD_UNIT = 100;
export const VESSEL_SURFACE_OFFSET = 0.05; // Y-offset to keep vessels perfectly on the ocean surface
export const OIL_SURFACE_OFFSET = 0.3; // Y-offset to keep oil spill slightly above the ocean waves

export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Converts geographic coordinates to local 3D world coordinates.
 * X axis = East (+) / West (-)
 * Y axis = Height/Elevation
 * Z axis = North (-) / South (+)
 */
export function latLonToWorld(
  lat: number,
  lon: number,
  originLat: number,
  originLon: number
): WorldPosition {
  const originLatRad = originLat * (Math.PI / 180);
  
  // Approximate meters per degree longitude at the given origin latitude
  const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos(originLatRad);

  const deltaLat = lat - originLat;
  const deltaLon = lon - originLon;

  const northMeters = deltaLat * METERS_PER_DEGREE_LAT;
  const eastMeters = deltaLon * metersPerDegreeLon;

  const x = eastMeters / METERS_PER_WORLD_UNIT;
  const y = 0; // Surface level
  const z = -northMeters / METERS_PER_WORLD_UNIT; // -Z points North in Three.js

  return { x, y, z };
}

/**
 * Converts environmental u and v velocity components to a Y-axis rotation (in radians)
 * suitable for Three.js objects.
 * u = East/West velocity (East is positive)
 * v = North/South velocity (North is positive)
 * Returns rotation in radians where an object initially pointing along -Z (North)
 * will be rotated to point in the direction of the flow.
 */
export function flowVectorToRotation(u: number, v: number): number {
  // Flow vector in 3D: X = u, Z = -v
  // We want to find the angle to rotate a -Z pointing object to (u, -v)
  // Math.atan2(x, z) gives the angle from Z axis.
  // Wait, if object points along -Z, its forward vector is (0, 0, -1).
  // The angle from (0,0,-1) to (u, -v) around Y axis:
  // Math.atan2(u, v) is standard mathematical mapping if we use standard atan2,
  // but let's just do atan2(-X, -Z) or similar.
  // In Three.js, rotation.y rotates X to -Z.
  // A positive rotation.y turns an object pointing -Z towards -X (West).
  // So:
  // dx = u, dz = -v
  // angle = Math.atan2(dx, -dz) gives rotation from -Z.
  // But wait, ThreeJS positive Y rotation turns from -Z to -X.
  // So we might need angle = Math.atan2(-dx, -dz) or something.
  // Let's use Math.atan2(u, v) -- if u=0, v=1 (North), dz=-1, dx=0. Math.atan2(0, 1) = 0.
  // if u=1, v=0 (East), dz=0, dx=1. Math.atan2(-1, 0) = -PI/2.
  // Wait. If dx=1, dz=0, and we want to rotate (0,0,-1) to (1,0,0).
  // (0,0,-1) rotated by -PI/2 around Y becomes (1,0,0). So angle = -PI/2.
  // This means angle = Math.atan2(-u, v);
  return Math.atan2(-u, v);
}
