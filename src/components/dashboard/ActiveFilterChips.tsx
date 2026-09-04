// src/components/dashboard/ActiveFilterChips.tsx

import React from 'react';
import { X } from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';
import { formatDate } from '../../utils/dateUtils';

export const ActiveFilterChips: React.FC = () => {
  const { filters, setFilters, resetFilters } = useDashboardContext();

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.selectedDate) {
    chips.push({
      key: 'selectedDate',
      label: `Date: ${formatDate(filters.selectedDate)}`,
      onRemove: () => setFilters({ selectedDate: null }),
    });
  } else if (filters.dateRange) {
    chips.push({
      key: 'dateRange',
      label: `Range: ${formatDate(filters.dateRange.start)} - ${formatDate(filters.dateRange.end)}`,
      onRemove: () => setFilters({ dateRange: null }),
    });
  }

  if (filters.confidenceRange) {
    const { min, max } = filters.confidenceRange;
    chips.push({
      key: 'confidenceRange',
      label: `Confidence: ${Math.round(min * 100)}–${Math.round(max * 100)}%`,
      onRemove: () => setFilters({ confidenceRange: null }),
    });
  }

  if (filters.areaRange) {
    const { min, max } = filters.areaRange;
    const maxStr = max === Number.POSITIVE_INFINITY ? '+' : `–${max}`;
    chips.push({
      key: 'areaRange',
      label: `Area: ${min}${maxStr} km²`,
      onRemove: () => setFilters({ areaRange: null, selectedSizeBucket: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-sans py-1 animate-in fade-in duration-150">
      <span className="text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
        Active Filters:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary font-semibold rounded-md transition-all duration-150 hover:bg-primary/20"
        >
          <span>{chip.label}</span>
          <button
            onClick={chip.onRemove}
            className="hover:text-foreground p-0.5 rounded transition-colors"
            title="Remove filter"
          >
            <X size={12} />
          </button>
        </span>
      ))}

      {chips.length > 1 && (
        <button
          onClick={resetFilters}
          className="text-xs font-bold text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
};
