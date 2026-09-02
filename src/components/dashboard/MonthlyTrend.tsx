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

  const calendarDays = useMemo(() => {
    const days: DayCell[] = [];
    const year = 2019;
    
    const monthSpillCounts = Array.from({ length: 12 }, (_, i) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const pt = data.find(d => d.month === monthNames[i]);
      return pt ? pt.spills : [3, 5, 2, 7, 4, 8, 12, 5, 6, 3, 8, 4][i];
    });

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const currentDate = new Date(startDate);
    
    const monthlyAllocations = monthSpillCounts.map(count => {
      const alloc = new Array(31).fill(0);
      let remaining = count;
      let step = 1;
      
      while (remaining > 0) {
        const idx = (remaining * 7 + step) % 28;
        if (alloc[idx] < 3) {
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

  const weeks = useMemo(() => {
    const grid: (DayCell | null)[][] = [];
    let currentWeek: (DayCell | null)[] = Array(7).fill(null);

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

  const monthLabels = useMemo(() => {
    const labels: { name: string; colIdx: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let lastMonth = -1;
    weeks.forEach((week, colIdx) => {
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

  // Clean Coral + White Light Mode heatmap styling (No harsh dark/black empty tiles)
  const getCellColor = (count: number) => {
    if (count === 0) {
      return 'fill-white stroke-[#eae8df] dark:fill-[#1b1b19] dark:stroke-[#2c2c2b]';
    }
    if (count === 1) {
      return 'fill-[#fbeae5] stroke-[#f4d0c7] dark:fill-[rgba(217,119,87,0.3)] dark:stroke-[rgba(217,119,87,0.4)]';
    }
    if (count === 2) {
      return 'fill-[#f3b19c] stroke-[#e78e72] dark:fill-[rgba(217,119,87,0.65)] dark:stroke-[rgba(217,119,87,0.75)]';
    }
    return 'fill-[#c96442] stroke-[#b05730] dark:fill-[#d97757] dark:stroke-[#b05730]';
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 32,
    });
  };

  const boxSize = 10;
  const gap = 2;
  const paddingLeft = 32;
  const paddingTop = 20;

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-foreground font-sans">
            Detections Heatmap
          </h3>
          <p className="text-xs text-muted-foreground font-semibold font-sans">
            Yearly distribution of satellite detections (2019)
          </p>
        </div>
        {/* Heatmap Legend - Coral + White */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold font-mono">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-white border border-[#eae8df] dark:bg-[#1b1b19] dark:border-[#2c2c2b]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#fbeae5] border border-[#f4d0c7] dark:bg-[rgba(217,119,87,0.3)]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#f3b19c] border border-[#e78e72] dark:bg-[rgba(217,119,87,0.65)]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#c96442] dark:bg-[#d97757]" />
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
          <text x={0} y={paddingTop + 0 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-muted-foreground font-mono">Sun</text>
          <text x={0} y={paddingTop + 1 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-muted-foreground font-mono">Mon</text>
          <text x={0} y={paddingTop + 2 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-muted-foreground font-mono">Tue</text>
          <text x={0} y={paddingTop + 3 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-muted-foreground font-mono">Wed</text>
          <text x={0} y={paddingTop + 4 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-muted-foreground font-mono">Thu</text>
          <text x={0} y={paddingTop + 5 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-muted-foreground font-mono">Fri</text>
          <text x={0} y={paddingTop + 6 * (boxSize + gap) + 8} className="text-[8px] font-bold fill-muted-foreground font-mono">Sat</text>

          {monthLabels.map((lbl) => (
            <text
              key={lbl.name}
              x={paddingLeft + lbl.colIdx * (boxSize + gap)}
              y={12}
              className="text-[9px] font-bold fill-muted-foreground font-mono"
            >
              {lbl.name}
            </text>
          ))}

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

        {hoveredCell !== null && (
          <div
            className="absolute z-50 bg-popover text-popover-foreground text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-md border border-border pointer-events-none font-mono"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <span className="text-primary font-bold mr-1.5">
              {hoveredCell.count} {hoveredCell.count === 1 ? 'spill' : 'spills'}
            </span>
            <span className="text-muted-foreground font-bold">
              on {hoveredCell.dateStr}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
export default MonthlyTrend;
