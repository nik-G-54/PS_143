// src/components/dashboard/SpillDetectionTrend.tsx

import React, { useMemo, useState } from 'react';
import { ChartCard } from './ChartCard';
import { useDashboardContext } from '../../context/DashboardContext';
import { buildTrendData } from '../../utils/spillAnalytics';
import { formatArea, formatConfidence } from '../../utils/formatters';
import { TrendPoint } from '../../types/spill';
import { isSameDay } from '../../utils/dateUtils';

export const SpillDetectionTrend: React.FC = () => {
  const { filteredSpills, filters, setFilters } = useDashboardContext();
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const trendData = useMemo(() => buildTrendData(filteredSpills), [filteredSpills]);

  const maxCount = useMemo(() => {
    if (trendData.length === 0) return 10;
    return Math.max(...trendData.map((d) => d.count), 5);
  }, [trendData]);

  const svgWidth = 500;
  const svgHeight = 220;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = useMemo(() => {
    if (trendData.length === 0) return [];
    const len = trendData.length;
    return trendData.map((d, index) => {
      const x =
        len === 1
          ? paddingLeft + chartWidth / 2
          : paddingLeft + (index / (len - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.count / maxCount) * chartHeight;
      return { x, y, data: d };
    });
  }, [trendData, chartWidth, chartHeight, maxCount]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = paddingTop + chartHeight;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [points, pathD, chartHeight]);

  const handlePointClick = (pt: TrendPoint) => {
    if (filters.selectedDate && isSameDay(filters.selectedDate, pt.date)) {
      setFilters({ selectedDate: null });
    } else {
      setFilters({ selectedDate: pt.date });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <ChartCard title="Spill Detection Trend" subtitle="Daily satellite detection volume over time">
      {trendData.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground font-mono">No data for selected filters</div>
      ) : (
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
            onMouseMove={handleMouseMove}
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + chartHeight * (1 - ratio);
              const val = Math.round(maxCount * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-muted-foreground font-mono font-medium"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            <path d={areaD} fill="url(#trendGradient)" />

            {/* Line Path */}
            <path
              d={pathD}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Points */}
            {points.map((pt, i) => {
              const isSelected = filters.selectedDate && isSameDay(filters.selectedDate, pt.data.date);
              const isHovered = hoveredPoint?.dateStr === pt.data.dateStr;

              return (
                <g key={i} className="cursor-pointer" onClick={() => handlePointClick(pt.data)}>
                  {/* Outer pulse if selected */}
                  {isSelected && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill="var(--primary)"
                      opacity="0.25"
                      className="animate-ping"
                    />
                  )}
                  {/* Main Circle */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected || isHovered ? '6' : '3.5'}
                    fill={isSelected ? 'var(--primary)' : 'var(--card)'}
                    stroke="var(--primary)"
                    strokeWidth={isSelected || isHovered ? '2.5' : '1.5'}
                    className="transition-all duration-150"
                    onMouseEnter={() => setHoveredPoint(pt.data)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}

            {/* X Axis Labels */}
            {points.map((pt, i) => {
              // Show label for first, middle, last or step
              const step = Math.ceil(points.length / 6);
              if (i % step !== 0 && i !== points.length - 1) return null;
              return (
                <text
                  key={i}
                  x={pt.x}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className="text-[9px] fill-muted-foreground font-mono font-semibold"
                >
                  {pt.data.displayDate.split(',')[0]}
                </text>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-50 bg-popover text-popover-foreground text-xs font-sans px-3 py-2 rounded-lg shadow-lg border border-border pointer-events-none -translate-x-1/2 -translate-y-full mb-2"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y - 8}px`,
              }}
            >
              <div className="font-bold text-foreground mb-1">{hoveredPoint.displayDate}</div>
              <div className="space-y-0.5 font-mono text-[11px]">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Detections:</span>
                  <span className="font-bold text-primary">{hoveredPoint.count}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Total Area:</span>
                  <span className="font-semibold">{formatArea(hoveredPoint.totalArea)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Avg Confidence:</span>
                  <span className="font-semibold">{formatConfidence(hoveredPoint.avgConfidence)}</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground font-sans mt-1.5 pt-1 border-t border-border/40 italic">
                Click point to filter date
              </div>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
};
