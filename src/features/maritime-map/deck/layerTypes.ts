export interface MockIncident {
  id: string;
  longitude: number;
  latitude: number;
  type: string;
  severity: 'low' | 'medium' | 'high';
}

export interface MockVessel {
  id: string;
  longitude: number;
  latitude: number;
  name: string;
  speed: number;
}

export interface MockAISTrack {
  id: string;
  vesselId: string;
  path: [number, number][]; // Array of [longitude, latitude]
}
