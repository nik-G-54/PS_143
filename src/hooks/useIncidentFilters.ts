import { useState, useMemo, useCallback } from 'react';
import { Incident, IncidentStatus } from '../types/incident';

interface UseIncidentFiltersReturn {
  filteredIncidents: Incident[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: IncidentStatus | 'ALL';
  setStatusFilter: (status: IncidentStatus | 'ALL') => void;
  totalCount: number;
  filteredCount: number;
}

export const useIncidentFilters = (incidents: Incident[]): UseIncidentFiltersReturn => {
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [statusFilter, setStatusFilterState] = useState<IncidentStatus | 'ALL'>('ALL');

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setStatusFilter = useCallback((status: IncidentStatus | 'ALL') => {
    setStatusFilterState(status);
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && incident.status !== statusFilter) {
        return false;
      }

      // 2. Search Query (matches ID or Location name case-insensitively)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = incident.id.toLowerCase().includes(query);
        const matchesLocation = incident.locationName.toLowerCase().includes(query);
        const matchesVessel = incident.vesselInvolved.toLowerCase().includes(query);
        return matchesId || matchesLocation || matchesVessel;
      }

      return true;
    });
  }, [incidents, statusFilter, searchQuery]);

  return {
    filteredIncidents,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    totalCount: incidents.length,
    filteredCount: filteredIncidents.length,
  };
};
