// src/components/dashboard/CaseStatusChart.tsx

import React, { useState } from 'react';
import { CaseStatusCount } from '../../types/dashboard';

interface CaseStatusChartProps {
  data: CaseStatusCount[];
}

export const CaseStatusChart: React.FC<CaseStatusChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, item) => acc + item.count, 0);

  // SVG parameters
  const cx = 150;
  const cy = 110;

  // Concentric circle configurations (Enlarged radii for the three rings)
  const ringConfigs = [
    { radius: 90, strokeWidth: 16, label: 'Active', colorClass: 'text-blue-500' },
    { radius: 70, strokeWidth: 16, label: 'Resolved', colorClass: 'text-emerald-500' },
    { radius: 50, strokeWidth: 16, label: 'Dismissed', colorClass: 'text-slate-500' },
  ];

  // Maximum value for scaling each ring (e.g. total cases represents full circle)
  const maxVal = total > 0 ? total : 30;

  return (
    <div className="flex flex-col h-full w-full justify-between items-center select-none relative">
      <div className="w-full text-left mb-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
          Case Status
        </h3>
      </div>

      {/* SVG Radial Rings Gauge */}
      <div className="relative w-full h-[220px] flex items-center justify-center my-1">
        <svg
          viewBox="0 0 300 220"
          className="w-full h-full overflow-visible"
        >
          {data.map((item, i) => {
            const config = ringConfigs[i];
            if (!config) return null;

            const circumference = 2 * Math.PI * config.radius;
            // Percent fill of the ring
            const pct = Math.min(item.count / maxVal, 1.0);
            const strokeDashoffset = circumference * (1 - pct);

            const isHovered = hoveredIndex === i;

            return (
              <g
                key={item.status}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Background track circle (faint gray - improved light mode contrast to text-slate-200) */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={config.radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-[#252830] opacity-80"
                  strokeWidth={config.strokeWidth}
                />

                {/* Foreground value ring wrapped in a rotation group to fix SVG CSS center bug */}
                <g transform={`rotate(-90 ${cx} ${cy})`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={config.radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={isHovered ? config.strokeWidth + 2 : config.strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out origin-center"
                    style={{
                      filter: isHovered ? `drop-shadow(0 0 4px ${item.color}80)` : 'none'
                    }}
                  />
                </g>
              </g>
            );
          })}

          {/* Centered text display inside the rings */}
          <g transform={`translate(${cx}, ${cy})`} className="pointer-events-none text-center">
            {hoveredIndex === null ? (
              <>
                <text
                  textAnchor="middle"
                  y={-5}
                  className="text-2xl font-extrabold font-mono fill-slate-900 dark:fill-slate-100"
                >
                  {total}
                </text>
                <text
                  textAnchor="middle"
                  y={15}
                  className="text-[9px] font-extrabold uppercase tracking-wider fill-slate-500 dark:fill-slate-400"
                >
                  Total Cases
                </text>
              </>
            ) : (
              <>
                <text
                  textAnchor="middle"
                  y={-8}
                  fill={data[hoveredIndex].color}
                  className="text-base font-extrabold uppercase tracking-wide"
                >
                  {data[hoveredIndex].status}
                </text>
                <text
                  textAnchor="middle"
                  y={12}
                  className="text-lg font-extrabold font-mono fill-slate-900 dark:fill-slate-200"
                >
                  {data[hoveredIndex].count} cases
                </text>
                <text
                  textAnchor="middle"
                  y={24}
                  className="text-[8px] font-extrabold fill-slate-500 dark:fill-slate-400 font-mono"
                >
                  ({Math.round((data[hoveredIndex].count / total) * 100)}%)
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Legend summary matching ring hover states */}
      <div className="w-full flex justify-around border-t border-slate-200 dark:border-[#252830]/50 pt-3 text-[10px] text-slate-600 dark:text-slate-400 font-extrabold font-mono">
        {data.map((item, index) => {
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={item.status}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center gap-1.5 cursor-pointer transition-opacity duration-150 ${
                hoveredIndex !== null && !isHovered ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default CaseStatusChart;
