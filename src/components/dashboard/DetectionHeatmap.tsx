// src/components/dashboard/DetectionHeatmap.tsx

import React, { useMemo, useState } from 'react';
import { ChartCard } from './ChartCard';
import { useDashboardContext } from '../../context/DashboardContext';
import { buildHeatmapData } from '../../utils/spillAnalytics';
import { HeatmapCell } from '../../types/spill';
import { isSameDay } from '../../utils/dateUtils';

export const DetectionHeatmap: React.FC = () => {
  const { filteredSpills, filters, setFilters } = useDashboardContext();
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const cells = useMemo(() => buildHeatmapData(filteredSpills), [filteredSpills]);

  const maxCount = useMemo(() => {
    if (cells.length === 0) return 1;
    return Math.max(...cells.map((c) => c.count));
  }, [cells]);

  const handleCellClick = (cell: HeatmapCell) => {
    if (filters.selectedDate && isSameDay(filters.selectedDate, cell.date)) {
      setFilters({ selectedDate: null });
    } else {
      setFilters({ selectedDate: cell.date });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 32,
    });
  };

  const boxSize = 12;
  const gap = 3;
  const paddingLeft = 30;
  const paddingTop = 25;

  const getCellFill = (count: number, isSelected: boolean) => {
    if (isSelected) return 'fill-primary stroke-foreground stroke-2';
    if (count === 0) return 'fill-card stroke-border';
    const ratio = count / maxCount;
    if (ratio <= 0.33) return 'fill-primary/40 stroke-primary/50';
    if (ratio <= 0.66) return 'fill-primary/75 stroke-primary/80';
    return 'fill-primary stroke-primary-dark';
  };

  return (
    <ChartCard
      title="Detection Activity Heatmap"
      subtitle="Daily satellite detection density"
      headerAction={
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold font-mono">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded bg-card border border-border" />
          <div className="w-2.5 h-2.5 rounded bg-primary/40" />
          <div className="w-2.5 h-2.5 rounded bg-primary/75" />
          <div className="w-2.5 h-2.5 rounded bg-primary" />
          <span>More</span>
        </div>
      }
    >
      {cells.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground font-mono">No activity data for current filters</div>
      ) : (
        <div className="w-full relative overflow-x-auto select-none pt-2 pb-1">
          <svg
            viewBox={`0 0 ${cells.length * (boxSize + gap) + paddingLeft + 20} 95`}
            className="w-full min-w-[500px] h-auto overflow-visible"
            onMouseMove={handleMouseMove}
          >
            {/* Days of week axis labels */}
            <text x={0} y={paddingTop + 10} className="text-[8px] font-bold fill-muted-foreground font-mono">
              Events
            </text>

            {cells.map((cell, idx) => {
              const x = paddingLeft + idx * (boxSize + gap);
              const y = paddingTop;
              const isSelected = filters.selectedDate ? isSameDay(filters.selectedDate, cell.date) : false;
              const fillClass = getCellFill(cell.count, isSelected);

              const showMonthLabel =
                idx === 0 ||
                (idx > 0 && cells[idx - 1].date.getMonth() !== cell.date.getMonth());

              return (
                <g key={cell.dateKey}>
                  {showMonthLabel && (
                    <text
                      x={x}
                      y={14}
                      className="text-[9px] font-bold fill-muted-foreground font-mono uppercase"
                    >
                      {cell.date.toLocaleDateString('en-US', { month: 'short' })}
                    </text>
                  )}
                  <rect
                    x={x}
                    y={y}
                    width={boxSize}
                    height={boxSize * 3}
                    rx={3}
                    className={`${fillClass} cursor-pointer transition-all duration-150 hover:scale-110`}
                    onClick={() => handleCellClick(cell)}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                  <text
                    x={x + boxSize / 2}
                    y={y + boxSize * 3 + 14}
                    textAnchor="middle"
                    className="text-[7px] font-mono fill-muted-foreground"
                  >
                    {cell.date.getDate()}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredCell && (
            <div
              className="absolute z-50 bg-popover text-popover-foreground text-xs font-sans px-2.5 py-1.5 rounded-md shadow-md border border-border pointer-events-none font-mono"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
              }}
            >
              <span className="text-primary font-bold mr-1.5">
                {hoveredCell.count} {hoveredCell.count === 1 ? 'spill' : 'spills'}
              </span>
              <span className="text-muted-foreground font-bold">on {hoveredCell.displayDate}</span>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
};
