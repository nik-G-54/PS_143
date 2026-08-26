export interface OilSpillDetection {
  id: string;
  latitude: number;
  longitude: number;
  detectedAt: string; // HH:MM format
  confidence: number;
  areaKm2: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  source: string;
}

// DEMO / MOCK DATA
export const mockOilSpill: OilSpillDetection = {
  id: 'OS-001',
  latitude: 13.18, // Placed exactly at the incident origin
  longitude: 80.32,
  detectedAt: '08:30', // Appears mid-simulation
  confidence: 87,
  areaKm2: 12.5,
  severity: 'HIGH',
  source: 'SATELLITE_DEMO'
};
