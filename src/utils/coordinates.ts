const METERS_PER_DEGREE_LAT = 111320;
export const METERS_PER_WORLD_UNIT = 100;
export const VESSEL_SURFACE_OFFSET = 0.0; // Y-offset to keep vessels perfectly on the ocean surface
export const OIL_SURFACE_OFFSET = 0.02; // Y-offset to keep oil spill slightly above the ocean

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
