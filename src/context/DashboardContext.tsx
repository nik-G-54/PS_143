// src/context/DashboardContext.tsx

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { NormalizedSpill, DashboardFilters } from '../types/spill';
import { useSpills } from '../hooks/useSpills';
import { isSameDay } from '../utils/dateUtils';

const initialFilters: DashboardFilters = {
  dateRange: null,
  selectedDate: null,
  confidenceRange: null,
  areaRange: null,
  selectedSizeBucket: null,
};

interface DashboardContextType {
  spills: NormalizedSpill[];
  filteredSpills: NormalizedSpill[];
  filters: DashboardFilters;
  setFilters: (partial: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  selectedSpillId: string | null;
  setSelectedSpillId: (id: string | null) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { spills, isLoading, error, refetch } = useSpills();
  const [filters, setFiltersState] = useState<DashboardFilters>(initialFilters);
  const [selectedSpillId, setSelectedSpillId] = useState<string | null>(null);

  const setFilters = useCallback((partial: Partial<DashboardFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, []);

  const filteredSpills = useMemo(() => {
    return spills.filter((spill) => {
      // 1. Date Range
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        const time = spill.detectedAt.getTime();
        const startTime = new Date(start).setHours(0, 0, 0, 0);
        const endTime = new Date(end).setHours(23, 59, 59, 999);
        if (time < startTime || time > endTime) return false;
      }

      // 2. Selected Single Date
      if (filters.selectedDate) {
        if (!isSameDay(spill.detectedAt, filters.selectedDate)) return false;
      }

      // 3. Confidence Range
      if (filters.confidenceRange) {
        const { min, max } = filters.confidenceRange;
        if (spill.confidence < min || spill.confidence > max) return false;
      }

      // 4. Area Range
      if (filters.areaRange) {
        const { min, max } = filters.areaRange;
        if (spill.area < min || (max !== Number.POSITIVE_INFINITY && spill.area >= max)) return false;
      }

      return true;
    });
  }, [spills, filters]);

  const value = useMemo(
    () => ({
      spills,
      filteredSpills,
      filters,
      setFilters,
      resetFilters,
      selectedSpillId,
      setSelectedSpillId,
      isLoading,
      error,
      refetch,
    }),
    [spills, filteredSpills, filters, setFilters, resetFilters, selectedSpillId, isLoading, error, refetch]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
