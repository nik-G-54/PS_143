export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface Vessel {
  id: string;
  name: string;
  type: string;
  imo: string;
  lat?: number;
  lng?: number;
  heading?: number;
  status?: string;
}

export interface Wind {
  direction: number;
  speed: number;
}

export interface Current {
  direction: number;
  speed: number;
}

export interface Environment {
  wind: Wind;
  current: Current;
}

export interface IncidentInfo {
  id: string;
  status: string;
  detectedAt: string;
  location: Location;
  confidence: number;
  vessel: Vessel;
  environment: Environment;
}

export interface TimelineEvent {
  label: string;
  time: string;
  isIncident?: boolean;
}

export type IncidentStatus = 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | string;

export interface Incident {
  id: string;
  date: string;
  detectedAt?: Date;
  latitude: number;
  longitude: number;
  locationName?: string;
  status?: IncidentStatus | null;
  confidence: number;        // Decimal 0.0 - 1.0 (e.g. 0.78 for 78%)
  vesselInvolved: string;
  spillArea: number;         // km²
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}


