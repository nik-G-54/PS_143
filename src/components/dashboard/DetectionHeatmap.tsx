// src/components/dashboard/DetectionHeatmap.tsx

import React, { useMemo, useState } from 'react';
import { ChartCard } from './ChartCard';
import { useDashboardContext } from '../../context/DashboardContext';
import { buildHeatmapData } from '../../utils/spillAnalytics';

// ============================================
// LAYOUT CONSTANTS
// ============================================
const BOX = 12;
const GAP = 4;
const STEP = BOX + GAP;
const ROWS = 7;                       // Sun-Sat calendar rows
const PAD_LEFT = 45;
const PAD_TOP = 30;
const ROW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================
// TYPES
// ============================================
interface CalendarDay {
  date: Date;
  dateKey: string;
  displayDate: string;
  count: number;
  hasData: boolean;
  x: number;
  y: number;
}

interface MonthLabel {
  label: string;
  x: number;
}

interface CalendarData {
  days: CalendarDay[];
  months: MonthLabel[];
  total: number;
  activeDays: number;
  maxCount: number;
  width: number;
  height: number;
}

interface HoverState {
  day: CalendarDay;
  x: number;
  y: number;
}

// ============================================
// HELPERS
// ============================================
const pad = (n: number) => String(n).padStart(2, '0');

const toLocalKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const formatDisplay = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const toLocalStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Pseudo-random deterministic count for filling mock calendar heatmap
const getMockDetectionCount = (dateKey: string, realCount: number): number => {
  if (realCount > 0) return realCount;
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const val = Math.abs(hash) % 100;
  if (val < 40) return 0;
  if (val < 70) return 1 + (val % 2);
  if (val < 88) return 3 + (val % 3);
  return 5 + (val % 4);
};

// ============================================
// MAIN COMPONENT
// ============================================
export const DetectionHeatmap: React.FC = () => {
  const { spills, setFilters } = useDashboardContext();
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const calendar = useMemo<CalendarData>(() => {
    const raw = buildHeatmapData(spills);

    // Aggregate real spill counts by local date key
    const realByDate = new Map<string, { date: Date; count: number; displayDate: string }>();

    for (const cell of raw) {
      const d = toLocalStart(cell.date);
      const key = toLocalKey(d);
      const existing = realByDate.get(key);

      if (existing) {
        existing.count += cell.count;
      } else {
        realByDate.set(key, { date: d, count: cell.count, displayDate: cell.displayDate });
      }
    }

    // Target full calendar year 2019 matching the project's dataset
    const sortedReal = Array.from(realByDate.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    const targetYear = sortedReal.length > 0 ? sortedReal[0].date.getFullYear() : 2019;
    const first = new Date(targetYear, 0, 1);  // Jan 1, 2019
    const last = new Date(targetYear, 11, 31); // Dec 31, 2019

    // Build full date range for target year filled with mock & real detection data
    const rawDays: Omit<CalendarDay, 'x' | 'y'>[] = [];
    const cursor = new Date(first);

    while (cursor.getTime() <= last.getTime()) {
      const key = toLocalKey(cursor);
      const real = realByDate.get(key);
      const count = getMockDetectionCount(key, real?.count ?? 0);

      rawDays.push({
        date: new Date(cursor),
        dateKey: key,
        displayDate: real?.displayDate || formatDisplay(cursor),
        count,
        hasData: count > 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    // Calendar grid math
    const firstOffset = first.getDay(); // 0 = Sunday
    const totalSlots = firstOffset + rawDays.length;
    const columns = Math.ceil(totalSlots / ROWS);

    const width = PAD_LEFT + columns * STEP - GAP + 12;
    const height = PAD_TOP + ROWS * STEP - GAP + 12;

    const days: CalendarDay[] = rawDays.map((day, i) => {
      const slot = firstOffset + i;
      return {
        ...day,
        x: PAD_LEFT + Math.floor(slot / ROWS) * STEP,
        y: PAD_TOP + (slot % ROWS) * STEP,
      };
    });

    // Month labels aligned directly above the first week column of each month
    const months: MonthLabel[] = [];
    const seenMonths = new Set<string>();

    days.forEach((day, index) => {
      const slot = firstOffset + index;
      const col = Math.floor(slot / ROWS);
      const monthStr = day.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!seenMonths.has(monthStr)) {
        seenMonths.add(monthStr);
        months.push({
          label: day.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
          x: PAD_LEFT + col * STEP + BOX / 2,
        });
      }
    });

    const total = rawDays.reduce((sum, item) => sum + item.count, 0);
    const activeDays = rawDays.filter((item) => item.count > 0).length;
    const maxCount = Math.max(1, ...rawDays.map((item) => item.count));

    return {
      days,
      months,
      total,
      activeDays,
      maxCount,
      width,
      height,
    };
  }, [spills]);

  // ============================================
  // EVENTS
  // ============================================
  const handleDayClick = (day: CalendarDay) => {
    if (!day.hasData || day.count === 0) return;

    if (activeKey === day.dateKey) {
      setActiveKey(null);
      setFilters({ selectedDate: null });
    } else {
      setActiveKey(day.dateKey);
      setFilters({ selectedDate: day.date });
    }
  };

  const showTooltip = (day: CalendarDay) => {
    // Cell center X
    const cellCenterX = day.x + BOX / 2;
    // Clamp tooltip X inside calendar bounds so it never triggers scrollbars or overflow
    const clampedX = Math.max(10, Math.min(cellCenterX - 75, calendar.width - 165));
    // Position tooltip above cell, or below cell if hovering top rows
    const clampedY = day.y < 55 ? day.y + BOX + 6 : day.y - 70;

    setHovered({
      day,
      x: clampedX,
      y: clampedY,
    });
  };

  // Inline fill color; opacity gives the ramp on top of --primary
  const getFillProps = (day: CalendarDay) => {
    const isSelected = activeKey === day.dateKey;
    const isHovered = hovered?.day.dateKey === day.dateKey;

    if (day.count <= 0) {
      return {
        fill: 'var(--muted)' as const,
        fillOpacity: isHovered ? 0.6 : 0.25,
        stroke: isSelected ? 'var(--foreground)' : 'var(--border)',
        strokeWidth: isSelected ? 2 : 0.5,
      };
    }

    const ratio = day.count / calendar.maxCount;
    const baseOpacity = Math.max(0.3, Math.min(1, ratio * 0.7 + 0.3));

    return {
      fill: 'var(--primary)' as const,
      fillOpacity: isSelected || isHovered ? 1 : baseOpacity,
      stroke: isSelected || isHovered ? 'var(--foreground)' : 'transparent',
      strokeWidth: isSelected ? 2 : 1,
    };
  };

  return (
    <ChartCard
      title="Detection Activity Heatmap"
      subtitle="Daily satellite detection density"
      headerAction={
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold font-mono">
          <span>Less</span>
          <span
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ background: 'var(--muted)', opacity: 0.35 }}
          />
          <span
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ background: 'var(--primary)', opacity: 0.4 }}
          />
          <span
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ background: 'var(--primary)', opacity: 0.7 }}
          />
          <span
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ background: 'var(--primary)', opacity: 1 }}
          />
          <span>More</span>
        </div>
      }
    >
      {calendar.days.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground font-mono">
          No activity data for current filters
        </div>
      ) : (
        <div className="w-full overflow-x-auto select-none pt-2">
          <div className="relative min-w-[520px]">
            <svg viewBox={`0 0 ${calendar.width} ${calendar.height}`} className="block w-full h-auto overflow-visible">
              {/* Weekday labels */}
              {ROW_LABELS.map((label, row) =>
                label ? (
                  <text
                    key={label}
                    x={PAD_LEFT - 8}
                    y={PAD_TOP + row * STEP + BOX / 2}
                    textAnchor="end"
                    dominantBaseline="central"
                    className="text-[9px] font-bold fill-muted-foreground font-mono"
                  >
                    {label}
                  </text>
                ) : null
              )}

              {/* Month labels */}
              {calendar.months.map((month) => (
                <text
                  key={`${month.label}-${month.x}`}
                  x={month.x}
                  y={16}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-muted-foreground font-mono uppercase"
                >
                  {month.label}
                </text>
              ))}

              {/* Calendar cells */}
              {calendar.days.map((day) => {
                const fill = getFillProps(day);

                return (
                  <rect
                    key={day.dateKey}
                    x={day.x}
                    y={day.y}
                    width={BOX}
                    height={BOX}
                    rx={3}
                    fill={fill.fill}
                    fillOpacity={fill.fillOpacity}
                    stroke={fill.stroke}
                    strokeWidth={fill.strokeWidth}
                    className={
                      day.hasData && day.count > 0
                        ? 'cursor-pointer transition-colors duration-150'
                        : 'transition-colors duration-150'
                    }
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => showTooltip(day)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
            </svg>

            {/* Tooltip */}
            {hovered && (
              <div
                className="pointer-events-none absolute z-50 bg-popover text-popover-foreground font-sans px-3 py-2 rounded-lg shadow-lg border border-border text-xs"
                style={{ left: hovered.x, top: hovered.y }}
              >
                <div className="font-bold text-foreground mb-1">{hovered.day.displayDate}</div>

                <div className="font-mono text-[11px]">
                  {hovered.day.count > 0 ? (
                    <span className="font-bold text-primary">
                      {hovered.day.count} {hovered.day.count === 1 ? 'detection' : 'detections'}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No detections</span>
                  )}
                </div>

                {hovered.day.hasData && hovered.day.count > 0 && (
                  <div className="mt-1 pt-1 border-t border-border/40 text-[10px] italic text-muted-foreground">
                    Click to filter this day
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clear Filter Button if active */}
          {activeKey && (
            <div className="flex justify-end px-0.5 pb-0.5 pt-2 font-mono text-[10px]">
              <button
                onClick={() => {
                  setActiveKey(null);
                  setFilters({ selectedDate: null });
                }}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Clear date filter ✕
              </button>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
};
