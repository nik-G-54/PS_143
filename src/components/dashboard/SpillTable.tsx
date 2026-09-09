// src/components/dashboard/SpillTable.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardContext } from '../../context/DashboardContext';
import { useTopVessels } from '../../hooks/useTopVessels';
import { SpillTableRow } from './SpillTableRow';
import { EmptyState } from './EmptyState';
import { Database, ArrowUpDown, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

type SortOption = 'largest-area' | 'newest-detection' | 'highest-confidence';

interface SpillTableProps {
  isFullPage?: boolean;
  maxRows?: number;
}

export const SpillTable: React.FC<SpillTableProps> = ({ isFullPage = false, maxRows = 7 }) => {
  const navigate = useNavigate();
  const { filteredSpills, selectedSpillId, setSelectedSpillId } = useDashboardContext();

  const [sortOption, setSortOption] = useState<SortOption>('largest-area');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

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

  const totalMatching = filteredSpills.length;
  const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));

  // Reset current page if filters reduce total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Pipeline step 2: Visible records depending on isFullPage
  const visibleIncidents = useMemo(() => {
    if (isFullPage) {
      const startIndex = (currentPage - 1) * pageSize;
      return sortedSpills.slice(startIndex, startIndex + pageSize);
    }
    return sortedSpills.slice(0, maxRows);
  }, [sortedSpills, isFullPage, currentPage, pageSize, maxRows]);

  const showingCount = visibleIncidents.length;

  // Fetch Rank 1 Vessels for currently visible spills
  const visibleIds = useMemo(() => visibleIncidents.map((s) => s.id), [visibleIncidents]);
  const topVessels = useTopVessels(visibleIds);

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
              : isFullPage
              ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalMatching)} of ${totalMatching} incidents`
              : `${showingCount} of ${totalMatching} incidents`}
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
              <tr className="bg-card border-b border-border text-muted-foreground text-[11px] uppercase font-mono tracking-wider">
                <th className="py-3 px-4 font-bold">SPILL ID</th>
                <th className="py-3 px-4 font-bold">DETECTED AT</th>
                <th className="py-3 px-4 font-bold">AREA</th>
                <th className="py-3 px-4 font-bold">CONFIDENCE</th>
                <th className="py-3 px-4 font-bold">RANK 1 VESSEL</th>
                <th className="py-3 px-4 text-right font-bold">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {visibleIncidents.map((spill) => (
                <SpillTableRow
                  key={spill.id}
                  spill={spill}
                  topVessel={topVessels[spill.id]}
                  isSelected={selectedSpillId === spill.id}
                  onClick={setSelectedSpillId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer / Pagination */}
      {totalMatching > 0 && (
        <div className="mt-4 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {isFullPage ? (
            <>
              <span className="text-muted-foreground font-mono">
                Page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalMatching} total incidents)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-foreground disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <div className="flex items-center gap-1 font-mono">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                      pageNum = start + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-foreground disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-muted-foreground font-mono text-xs">
                Showing top {showingCount} of {totalMatching} detected incidents
              </span>
              <button
                type="button"
                onClick={() => navigate('/incident-overview')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
              >
                <span>View all incidents</span>
                <ArrowRight size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
