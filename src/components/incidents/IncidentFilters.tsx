import React from 'react';
import { IncidentStatus } from '../../types/incident';
import { Search, SlidersHorizontal } from 'lucide-react';

interface IncidentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: IncidentStatus | 'ALL';
  onStatusFilterChange: (status: IncidentStatus | 'ALL') => void;
  filteredCount: number;
  totalCount: number;
}

export const IncidentFilters: React.FC<IncidentFiltersProps> = React.memo(({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  filteredCount,
  totalCount,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusFilterChange(e.target.value as IncidentStatus | 'ALL');
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 bg-white border border-[#F0F0F0] dark:bg-[#1A1D27] dark:border-[#252830] rounded-xl transition-colors duration-200">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input Container */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF] dark:text-[#64748B]">
            <Search size={16} strokeWidth={1.5} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by ID, location, or vessel..."
            className="w-full h-11 pl-10 pr-4 bg-[#F9FAFB] dark:bg-[#0F1117] border border-[#E5E7EB] dark:border-[#252830] rounded-lg text-sm text-[#1A1D23] dark:text-[#F1F5F9] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00B894] dark:focus:border-[#00D9A6] focus:ring-3 focus:ring-[#00B894]/10 dark:focus:ring-[#00D9A6]/10 transition-all duration-200"
          />
        </div>

        {/* Dropdown Container */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF] dark:text-[#64748B]">
            <SlidersHorizontal size={14} strokeWidth={1.5} />
          </span>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-[160px] h-11 pl-9 pr-8 bg-[#F9FAFB] dark:bg-[#0F1117] border border-[#E5E7EB] dark:border-[#252830] rounded-lg text-sm text-[#1A1D23] dark:text-[#F1F5F9] focus:outline-none focus:border-[#00B894] dark:focus:border-[#00D9A6] focus:ring-3 focus:ring-[#00B894]/10 dark:focus:ring-[#00D9A6]/10 appearance-none cursor-pointer transition-all duration-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#9CA3AF] dark:text-[#64748B]">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Results Count Info */}
      <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
        <span className="text-[11px] font-bold text-[#9CA3AF] dark:text-[#64748B] uppercase tracking-[0.5px]">RESULTS:</span>
        <span className="text-[13px] text-[#6B7280] dark:text-[#94A3B8]">
          Showing {filteredCount} of {totalCount}
        </span>
      </div>
    </div>
  );
});

IncidentFilters.displayName = 'IncidentFilters';
