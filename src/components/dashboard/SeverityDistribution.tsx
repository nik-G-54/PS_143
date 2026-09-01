// src/components/dashboard/SeverityDistribution.tsx

import React, { useState } from 'react';
import { SeverityCount } from '../../types/dashboard';

interface SeverityDistributionProps {
  data: SeverityCount[];
}

export const SeverityDistribution: React.FC<SeverityDistributionProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const total = data.reduce((acc, item) => acc + item.count, 0);

  // SVG parameters (Enlarged circle radius)
  const cx = 150;
  const cy = 110;
  const radius = 90;

  // Helper to convert polar to Cartesian coordinates
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  // Generate SVG path for a pie slice
  const getCoordinates = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  let accumulatedAngle = 0;

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top - 30,
    });
  };

  return (
    <div className="flex flex-col h-full w-full justify-between items-center relative">
      <div className="w-full text-left mb-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
          Severity Distribution
        </h3>
      </div>

      {/* SVG Pie Chart (Larger viewbox dimensions) */}
      <div className="relative w-full h-[220px] flex items-center justify-center my-2">
        <svg
          viewBox="0 0 300 220"
          className="w-full h-full overflow-visible"
          onMouseMove={handleMouseMove}
        >
          {data.map((item, index) => {
            const angle = total > 0 ? (item.count / total) * 360 : 0;
            const startAngle = accumulatedAngle;
            const endAngle = accumulatedAngle + angle;
            accumulatedAngle = endAngle;

            if (item.count === 0) return null;

            // Handle edge case where a single category dominates 100% of data
            if (angle >= 360) {
              return (
                <circle
                  key={item.severity}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={item.color}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            }

            const pathData = getCoordinates(startAngle, endAngle);
            const isHovered = hoveredIndex === index;

            return (
              <path
                key={item.severity}
                d={pathData}
                fill={item.color}
                className="cursor-pointer transition-all duration-200"
                style={{
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  transformOrigin: `${cx}px ${cy}px`,
                  opacity: hoveredIndex !== null && !isHovered ? 0.6 : 1,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip rendered cleanly in DOM */}
        {hoveredIndex !== null && (
          <div
            className="absolute z-50 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded shadow-lg border border-slate-700 pointer-events-none font-mono"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <span className="uppercase text-slate-400 mr-1.5 font-bold">
              {data[hoveredIndex].severity}:
            </span>
            <span>{data[hoveredIndex].count}</span>
            <span className="text-slate-400 ml-1">
              ({Math.round((data[hoveredIndex].count / total) * 100)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
export default SeverityDistribution;
