// src/types/dashboard.ts

// === RECENT INCIDENTS TABLE ===
export interface RecentIncident {
  spill_id: string;           // Internal identifier (for map routing keys)
  timestamp: string;          // ISO 8601
  location: {
    latitude: number;
    longitude: number;
    name: string;             // "Mediterranean Sea, East of Malta"
  };
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;         // 0.0 - 1.0
  status: 'NEW' | 'REVIEW' | 'CLOSED';
  suspected_vessel?: string;  // "MT Pacific Star"
  vessel_type?: string;       // "Tanker"
  area_km2?: number;
}

// === MONTHLY TREND ===
export interface MonthlyDataPoint {
  month: string;              // "Jan", "Feb", etc.
  spills: number;
  year: number;
}

// === SEVERITY DISTRIBUTION ===
export interface SeverityCount {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  color: string;              // hex color for chart
}

// === CASE LIFECYCLE STATUS ===
export interface CaseStatusCount {
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  count: number;
  color: string;
}

// === FULL DASHBOARD DATA ===
export interface DashboardData {
  recentIncidents: RecentIncident[];
  monthlyTrend: MonthlyDataPoint[];
  severityDistribution: SeverityCount[];
  caseStatusDistribution: CaseStatusCount[];
}
