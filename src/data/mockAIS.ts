export interface AISPosition {
  timestamp: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
}

// DEMO / MOCK AIS DATA
export const mockAISTrack: AISPosition[] = [
  { timestamp: '06:00', lat: 13.08, lng: 80.18, heading: 45, speed: 12.5 },
  { timestamp: '06:30', lat: 13.10, lng: 80.22, heading: 47, speed: 12.3 },
  { timestamp: '07:00', lat: 13.12, lng: 80.25, heading: 46, speed: 12.4 },
  { timestamp: '07:30', lat: 13.14, lng: 80.28, heading: 45, speed: 12.0 },
  { timestamp: '08:00', lat: 13.16, lng: 80.30, heading: 44, speed: 11.8 },
  { timestamp: '08:15', lat: 13.17, lng: 80.31, heading: 45, speed: 11.5 },
  { timestamp: '08:25', lat: 13.175, lng: 80.315, heading: 45, speed: 11.2 },
  { timestamp: '08:30', lat: 13.18, lng: 80.32, heading: 46, speed: 11.0 }, // Near incident
  { timestamp: '08:45', lat: 13.185, lng: 80.325, heading: 45, speed: 10.5 },
  { timestamp: '09:00', lat: 13.19, lng: 80.33, heading: 45, speed: 10.0 },
  { timestamp: '09:15', lat: 13.195, lng: 80.34, heading: 46, speed: 9.8 },
  { timestamp: '09:30', lat: 13.20, lng: 80.35, heading: 45, speed: 9.5 } // Endpoint matching vessel
];
