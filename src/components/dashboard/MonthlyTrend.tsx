// src/components/dashboard/MonthlyTrend.tsx

import React, { useState, useMemo } from 'react';
import { MonthlyDataPoint } from '../../types/dashboard';

interface MonthlyTrendProps {
  data: MonthlyDataPoint[];
}

interface DayCell {
  dateStr: string;
  count: number;
  monthIndex: number;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
}

export const MonthlyTrend: React.FC<MonthlyTrendProps> = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Generate deterministic daily counts for 2019 matching the monthly counts
  const calendarDays = useMemo(() => {
    const days: DayCell[] = [];
    const year = 2019;
    
    // Monthly spill counts from props (fallback if missing)
    const monthSpillCounts = Array.from({ length: 12 }, (_, i) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const pt = data.find(d => d.month === monthNames[i]);
      return pt ? pt.spills : [3, 5, 2, 7, 4, 8, 12, 5, 6, 3, 8, 4][i];
    });

    // Start on Jan 1, 2019 (Tuesday) and end on Dec 31, 2019 (Tuesday)
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const currentDate = new Date(startDate);
    
    // Store daily counts per month to distribute them
    const monthlyAllocations = monthSpillCounts.map(count => {
      // Create list of random but deterministic days that have spills
      const alloc = new Array(31).fill(0);
      let remaining = count;
      let step = 1;
      
      while (remaining > 0) {
        const idx = (remaining * 7 + step) % 28; // deterministic distribution
        if (alloc[idx] < 3) { // limit max spills on one day to 3
          alloc[idx] += 1;
          remaining -= 1;
        }
        step += 3;
      }
      return alloc;
    });

    while (currentDate <= endDate) {
      const m = currentDate.getMonth();
      const d = currentDate.getDate();
      const dayOfWeek = currentDate.getDay();
      
      const dateStr = currentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      });

      // Retrieve allocated count
      const count = monthlyAllocations[m][d - 1] || 0;

      days.push({
        dateStr,
        count,
        monthIndex: m,
        dayOfWeek
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  }, [data]);

  // Format calendar into 53 weeks x 7 days
  const weeks = useMemo(() => {
    const grid: (DayCell | null)[][] = [];
    let currentWeek: (DayCell | null)[] = Array(7).fill(null);

    // Jan 1, 2019 was a Tuesday (dayOfWeek = 2)
    // Pad first week with nulls for Sunday/Monday
    calendarDays.forEach((day) => {
      if (day.dayOfWeek === 0 && currentWeek.some(d => d !== null)) {
        grid.push(currentWeek);
        currentWeek = Array(7).fill(null);
      }
      currentWeek[day.dayOfWeek] = day;
    });
    
    if (currentWeek.some(d => d !== null)) {
      grid.push(currentWeek);
    }
    return grid;
  }, [calendarDays]);

  // Find column index where each month starts
  const monthLabels = useMemo(() => {
    const labels: { name: string; colIdx: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let lastMonth = -1;
    weeks.forEach((week, colIdx) => {
      // Find the first non-null day of the week to check month
      const firstDay = week.find(d => d !== null);
      if (firstDay && firstDay.monthIndex !== lastMonth) {
        labels.push({
          name: monthNames[firstDay.monthIndex],
          colIdx
        });
        lastMonth = firstDay.monthIndex;
      }
    });
    return labels;
  }, [weeks]);

  // Colors for dark and light modes (improved light mode empty cells contrast to #F1F5F9 & #E2E8F0)
  const getCellColor = (count: number) => {
    if (count === 0) {
      return 'fill-[#F1F5F9] stroke-[#E2E8F0] dark:fill-[#1E2130] dark:stroke-[#252830]';
    }
    if (count === 1) {
      return 'fill-[rgba(14,165,229,0.3)] stroke-[rgba(14,165,229,0.45)] dark:fill-[rgba(0,217,166,0.25)] dark:stroke-[rgba(0,217,166,0.35)]';
    }
    if (count === 2) {
      return 'fill-[rgba(14,165,229,0.65)] stroke-[rgba(14,165,229,0.8)] dark:fill-[rgba(0,217,166,0.6)] dark:stroke-[rgba(0,217,166,0.7)]';
    }
    return 'fill-[#0EA5E9] stroke-[#0EA5E9] dark:fill-[#00D9A6] dark:stroke-[#00D9A6]';
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 32,
    });
  };

  // Dimensions
  const boxSize = 10;
  const gap = 2;
  const paddingLeft = 32;
  const paddingTop = 20;

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
            Detections Heatmap
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Yearly distribution of satellite detections (2019)
          </p>
        </div>
        {/* Heatmap Legend */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#F1F5F9] border border-[#E2E8F0] dark:bg-[#1E2130] dark:border-[#252830]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[rgba(14,165,229,0.3)] dark:bg-[rgba(0,217,166,0.25)]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[rgba(14,165,229,0.65)] dark:bg-[rgba(0,217,166,0.6)]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#0EA5E9] dark:bg-[#00D9A6]" />
          <span>More</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 w-full relative overflow-x-auto select-none mt-2">
        <svg
          viewBox={`0 0 ${53 * (boxSize + gap) + paddingLeft} 120`}
          className="w-full min-w-[620px] h-full overflow-visible"
          onMouseMove={handleMouseMove}
        >
          {/* Day of Week Labels (Darker contrast in light mode) */}
          <text x={0} y={paddingTop + 0 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400">Sun</text>
          <text x={0} y={paddingTop + 1 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400">Mon</text>
          <text x={0} y={paddingTop + 2 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400">Tue</text>
          <text x={0} y={paddingTop + 3 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400">Wed</text>
          <text x={0} y={paddingTop + 4 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400">Thu</text>
          <text x={0} y={paddingTop + 5 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400">Fri</text>
          <text x={0} y={paddingTop + 6 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400">Sat</text>

          {/* Month Labels (Darker contrast in light mode) */}
          {monthLabels.map((lbl) => (
            <text
              key={lbl.name}
              x={paddingLeft + lbl.colIdx * (boxSize + gap)}
              y={12}
              className="text-[9px] font-bold fill-slate-500 dark:fill-slate-400"
            >
              {lbl.name}
            </text>
          ))}

          {/* Grid Blocks */}
          {weeks.map((week, colIdx) => {
            const x = paddingLeft + colIdx * (boxSize + gap);
            return (
              <g key={colIdx}>
                {week.map((day, rowIdx) => {
                  if (!day) return null;
                  const y = paddingTop + rowIdx * (boxSize + gap);
                  const colorClass = getCellColor(day.count);

                  return (
                    <rect
                      key={day.dateStr}
                      x={x}
                      y={y}
                      width={boxSize}
                      height={boxSize}
                      rx={1.5}
                      className={`${colorClass} cursor-pointer transition-all duration-100 hover:scale-[1.2]`}
                      style={{
                        transformOrigin: `${x + boxSize / 2}px ${y + boxSize / 2}px`
                      }}
                      onMouseEnter={() => setHoveredCell(day)}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip in DOM */}
        {hoveredCell !== null && (
          <div
            className="absolute z-50 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded shadow-lg border border-slate-700 pointer-events-none font-mono"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <span className="text-[#0ea5e9] dark:text-[#00d9a6] font-bold mr-1.5">
              {hoveredCell.count} {hoveredCell.count === 1 ? 'spill' : 'spills'}
            </span>
            <span className="text-slate-400 font-bold">
              on {hoveredCell.dateStr}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
export default MonthlyTrend;
