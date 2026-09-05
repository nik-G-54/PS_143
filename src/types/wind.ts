// src/types/wind.ts
export interface WindField {
  u: number;       // zonal velocity (east-west)
  v: number;       // meridional velocity (north-south)
  speed: number;   // magnitude
  direction: number; // degrees
  unit: string;
}

export interface WindTextureData {
  width: number;
  height: number;
  bounds: [number, number, number, number]; // [west, south, east, north]
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
  image: ImageData;
}
