// src/components/dashboard/SpillTable.tsx

import React, { useState, useMemo } from 'react';
import { useDashboardContext } from '../../context/DashboardContext';
import { SpillTableRow } from './SpillTableRow';
import { EmptyState } from './EmptyState';
import { Database, ArrowUpDown } from 'lucide-react';

type SortOption = 'largest-area' | 'newest-detection' | 'highest-confidence';

export const SpillTable: React.FC = () => {
  const { filteredSpills, selectedSpillId, setSelectedSpillId } = useDashboardContext();

  const [sortOption, setSortOption] = useState<SortOption>('largest-area');

  // Pipeline step 1: Sort ALL matching filtered records
  const sortedSpills = useMemo(() => {
    return [...filteredSpills].sort((a, b) => {
      if (sortOption === 'largest-area') {
        return b.area - a.area;
      }
      if (sortOption === 'newest-detection') {
        return b.detectedAt.getTime() - a.detectedAt.getTime();
      }
      if (sortOption === 'highest-confidence') {
        return b.confidence - a.confidence;
      }
      return 0;
    });
  }, [filteredSpills, sortOption]);

  // Pipeline step 2: SLICE FIRST 7 matching records
  const visibleIncidents = useMemo(() => {
    return sortedSpills.slice(0, 7);
  }, [sortedSpills]);

  const totalMatching = filteredSpills.length;
  const showingCount = visibleIncidents.length;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 w-full flex flex-col font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <Database size={18} className="text-primary" />
            <span>Incident Overview</span>
          </h3>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5 font-mono">
            {totalMatching === 0
              ? 'No matching incidents'
              : `Showing ${showingCount} of ${totalMatching} matching incidents`}
          </p>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1">
            <ArrowUpDown size={13} />
            <span>Sort by:</span>
          </span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-foreground font-semibold cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="largest-area">Largest area ↓</option>
            <option value="newest-detection">Newest detection ↓</option>
            <option value="highest-confidence">Highest confidence ↓</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {visibleIncidents.length === 0 ? (
        <EmptyState message="No incidents match the current filters." />
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border border-border/60 bg-background/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card border-b border-border text-muted-foreground text-xs uppercase font-sans tracking-wider">
                <th className="py-3 px-4 font-bold">Detected</th>
                <th className="py-3 px-4 font-bold">Area</th>
                <th className="py-3 px-4 font-bold">Confidence</th>
                <th className="py-3 px-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleIncidents.map((spill) => (
                <SpillTableRow
                  key={spill.id}
                  spill={spill}
                  isSelected={selectedSpillId === spill.id}
                  onClick={setSelectedSpillId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
