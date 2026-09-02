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

  // Concentric circle configurations
  const ringConfigs = [
    { radius: 90, strokeWidth: 16, label: 'Active' },
    { radius: 70, strokeWidth: 16, label: 'Resolved' },
    { radius: 50, strokeWidth: 16, label: 'Dismissed' },
  ];

  const maxVal = total > 0 ? total : 30;

  return (
    <div className="flex flex-col h-full w-full justify-between items-center select-none relative">
      <div className="w-full text-left mb-2">
        <h3 className="text-base font-bold text-foreground font-sans">
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
                {/* Background track circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={config.radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-border opacity-80"
                  strokeWidth={config.strokeWidth}
                />

                {/* Foreground value ring */}
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
                  className="text-2xl font-extrabold font-mono fill-foreground"
                >
                  {total}
                </text>
                <text
                  textAnchor="middle"
                  y={15}
                  className="text-[9px] font-extrabold uppercase tracking-wider fill-muted-foreground font-sans"
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
                  className="text-base font-extrabold uppercase tracking-wide font-sans"
                >
                  {data[hoveredIndex].status}
                </text>
                <text
                  textAnchor="middle"
                  y={12}
                  className="text-lg font-extrabold font-mono fill-foreground"
                >
                  {data[hoveredIndex].count} cases
                </text>
                <text
                  textAnchor="middle"
                  y={24}
                  className="text-[8px] font-extrabold fill-muted-foreground font-mono"
                >
                  ({Math.round((data[hoveredIndex].count / total) * 100)}%)
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Legend summary matching ring hover states */}
      <div className="w-full flex justify-around border-t border-border pt-3 text-[10px] text-muted-foreground font-extrabold font-mono">
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
