// src/components/dashboard/DashboardFilters.tsx

import React from 'react';
import { Calendar, Shield, Maximize2, RotateCcw } from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';

export const DashboardFilters: React.FC = () => {
  const { filters, setFilters, resetFilters } = useDashboardContext();

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setFilters({ confidenceRange: null });
      return;
    }
    const [minStr, maxStr] = val.split('-');
    setFilters({
      confidenceRange: { min: parseFloat(minStr), max: parseFloat(maxStr) },
    });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setFilters({ areaRange: null, selectedSizeBucket: null });
      return;
    }

    if (val === '<0.5') {
      setFilters({ areaRange: { min: 0, max: 0.5 }, selectedSizeBucket: '<0.5' });
    } else if (val === '0.5-1') {
      setFilters({ areaRange: { min: 0.5, max: 1 }, selectedSizeBucket: '0.5-1' });
    } else if (val === '1-2') {
      setFilters({ areaRange: { min: 1, max: 2 }, selectedSizeBucket: '1-2' });
    } else if (val === '2-5') {
      setFilters({ areaRange: { min: 2, max: 5 }, selectedSizeBucket: '2-5' });
    } else if (val === '5+') {
      setFilters({ areaRange: { min: 5, max: Number.POSITIVE_INFINITY }, selectedSizeBucket: '5+' });
    }
  };

  const handleDatePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setFilters({ dateRange: null, selectedDate: null });
      return;
    }

    const now = new Date('2019-01-31T23:59:59Z'); // Reference dataset scope
    if (val === 'jan-2019') {
      setFilters({
        dateRange: { start: new Date('2019-01-01T00:00:00Z'), end: new Date('2019-01-31T23:59:59Z') },
        selectedDate: null,
      });
    } else if (val === 'last-7-days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      setFilters({ dateRange: { start, end: now }, selectedDate: null });
    } else if (val === 'last-14-days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 14);
      setFilters({ dateRange: { start, end: now }, selectedDate: null });
    }
  };

  const confidenceValue = filters.confidenceRange
    ? `${filters.confidenceRange.min}-${filters.confidenceRange.max}`
    : '';

  const sizeValue = filters.selectedSizeBucket || '';

  const isFiltered =
    Boolean(filters.dateRange) ||
    Boolean(filters.selectedDate) ||
    Boolean(filters.confidenceRange) ||
    Boolean(filters.areaRange);

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        {/* Date Filter */}
        <div className="relative flex items-center">
          <Calendar size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
          <select
            onChange={handleDatePresetChange}
            value={filters.selectedDate ? 'custom' : filters.dateRange ? 'custom-range' : ''}
            className="pl-8 pr-8 py-1.5 bg-background border border-border rounded-lg text-foreground font-semibold cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
          >
            <option value="">Date: All Time</option>
            <option value="jan-2019">January 2019</option>
            <option value="last-7-days">Last 7 Days of Jan</option>
            <option value="last-14-days">Last 14 Days of Jan</option>
            {(filters.selectedDate || filters.dateRange) && <option value="custom">Selected Date Active</option>}
          </select>
          <span className="absolute right-2.5 pointer-events-none text-muted-foreground text-[10px]">▼</span>
        </div>

        {/* Confidence Range Filter */}
        <div className="relative flex items-center">
          <Shield size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
          <select
            value={confidenceValue}
            onChange={handleConfidenceChange}
            className="pl-8 pr-8 py-1.5 bg-background border border-border rounded-lg text-foreground font-semibold cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
          >
            <option value="">Confidence: All</option>
            <option value="0.5-0.6">50–60% Confidence</option>
            <option value="0.6-0.7">60–70% Confidence</option>
            <option value="0.7-0.8">70–80% Confidence</option>
            <option value="0.8-0.9">80–90% Confidence</option>
            <option value="0.9-1">90–100% Confidence</option>
          </select>
          <span className="absolute right-2.5 pointer-events-none text-muted-foreground text-[10px]">▼</span>
        </div>

        {/* Spill Size Filter */}
        <div className="relative flex items-center">
          <Maximize2 size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
          <select
            value={sizeValue}
            onChange={handleSizeChange}
            className="pl-8 pr-8 py-1.5 bg-background border border-border rounded-lg text-foreground font-semibold cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
          >
            <option value="">Spill Size: All</option>
            <option value="<0.5">&lt; 0.5 km²</option>
            <option value="0.5-1">0.5–1 km²</option>
            <option value="1-2">1–2 km²</option>
            <option value="2-5">2–5 km²</option>
            <option value="5+">5+ km²</option>
          </select>
          <span className="absolute right-2.5 pointer-events-none text-muted-foreground text-[10px]">▼</span>
        </div>
      </div>

      {/* Clear Filters Button */}
      {isFiltered && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-muted text-foreground font-semibold rounded-lg border border-border transition-all duration-150 shrink-0"
        >
          <RotateCcw size={13} />
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  );
};
