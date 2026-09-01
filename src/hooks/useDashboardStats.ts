// src/hooks/useDashboardStats.ts

import { useState, useEffect, useCallback } from 'react';
import { DashboardData, RecentIncident } from '../types/dashboard';
import { mockDashboardData } from '../data/mockDashboard';

export function useDashboardStats() {
  const [data, setData] = useState<DashboardData>(mockDashboardData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const mapStatus = (rawStatus: string): RecentIncident['status'] => {
    const status = rawStatus?.toUpperCase() || '';
    if (status === 'NEW' || status === 'DETECTED' || status === 'ACTIVE') {
      return 'NEW';
    }
    if (status === 'REVIEW' || status === 'UNDER_INVESTIGATION' || status === 'INVESTIGATING') {
      return 'REVIEW';
    }
    return 'CLOSED';
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/dashboard');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const raw = await res.json();
          
          const parsedData: DashboardData = {
            recentIncidents: (raw.recent_incidents ?? raw.recentIncidents ?? []).map((item: any) => ({
              spill_id: item.spill_id ?? item.spillId ?? Math.random().toString(),
              timestamp: item.timestamp ?? item.date ?? new Date().toISOString(),
              location: item.location ?? {
                latitude: item.latitude ?? item.centroid?.latitude ?? 0,
                longitude: item.longitude ?? item.centroid?.longitude ?? 0,
                name: item.locationName ?? item.location_name ?? 'Unknown Location',
              },
              severity: (item.severity?.toUpperCase() as any) ?? 'MEDIUM',
              confidence: item.confidence ?? item.detection_confidence ?? 0.8,
              status: mapStatus(item.status),
              suspected_vessel: item.suspected_vessel ?? item.vesselInvolved ?? item.vessel_involved,
              vessel_type: item.vessel_type ?? item.vesselType,
              area_km2: item.area_km2 ?? item.spillArea ?? item.spill_area,
            })),
            monthlyTrend: (raw.monthly_trend ?? raw.monthlyTrend ?? []).map((item: any) => ({
              month: item.month,
              spills: item.spills ?? item.count ?? 0,
              year: item.year ?? 2019,
            })),
            severityDistribution: (raw.severity_distribution ?? raw.severityDistribution ?? []).map((item: any) => ({
              severity: (item.severity?.toUpperCase() as any) ?? 'MEDIUM',
              count: item.count ?? 0,
              color: item.color ?? (item.severity === 'HIGH' ? '#EF4444' : item.severity === 'LOW' ? '#22C55E' : '#F59E0B'),
            })),
            caseStatusDistribution: (raw.case_status_distribution ?? raw.caseStatusDistribution ?? []).map((item: any) => ({
              status: (item.status?.toUpperCase() as any) ?? 'ACTIVE',
              count: item.count ?? 0,
              color: item.color ?? (item.status === 'RESOLVED' ? '#10B981' : item.status === 'DISMISSED' ? '#64748B' : '#3B82F6'),
            })),
          };
          setData(parsedData);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend API `/api/v1/dashboard` is not online yet. Using mock data.', e);
    }
    // Fallback to local mock data
    setData(mockDashboardData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    dashboardData: data,
    loading,
    error,
    refetch: fetchData
  };
}
