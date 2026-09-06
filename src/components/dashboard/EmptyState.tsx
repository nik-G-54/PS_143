// src/components/dashboard/EmptyState.tsx

import React from 'react';
import { FilterX, RotateCcw } from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';

interface EmptyStateProps {
  message?: string;
  isFilterEmpty?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No spills match current filters. Try adjusting your parameters.',
  isFilterEmpty = true,
}) => {
  const { resetFilters } = useDashboardContext();

  return (
    <div className="w-full py-16 px-4 bg-card/40 border border-border border-dashed rounded-xl flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
        <FilterX size={24} />
      </div>
      <h4 className="text-base font-bold text-foreground font-sans mb-1">No Spills Found</h4>
      <p className="text-sm text-muted-foreground font-sans max-w-md mb-5">{message}</p>

      {isFilterEmpty && (
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg shadow hover:bg-primary/90 transition-all duration-150"
        >
          <RotateCcw size={14} />
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  );
};
