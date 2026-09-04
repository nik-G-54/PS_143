// src/hooks/useDashboardFilters.ts

import { useDashboardContext } from '../context/DashboardContext';

export function useDashboardFilters() {
  const { filters, setFilters, resetFilters } = useDashboardContext();
  return { filters, setFilters, resetFilters };
}
