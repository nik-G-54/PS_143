// src/components/investigation/SpillTrajectory.tsx

import React, { useState, useMemo } from 'react';
import { TrajectoryPoint } from '../../types/spill';
import { formatIncidentDate } from '../../utils/dateUtils';
import { MapPin, Navigation } from 'lucide-react';

interface SpillTrajectoryProps {
  trajectory: TrajectoryPoint[];
}

export const SpillTrajectory: React.FC<SpillTrajectoryProps> = ({ trajectory }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const maxIdx = Math.max(0, trajectory.length - 1);
  const currentPt = trajectory[Math.min(selectedIndex, maxIdx)] || trajectory[0];

  const bounds = useMemo(() => {
    if (trajectory.length === 0) return { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 };
    const lats = trajectory.map((t) => t.latitude);
    const lons = trajectory.map((t) => t.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latMargin = Math.max((maxLat - minLat) * 0.15, 0.005);
    const lonMargin = Math.max((maxLon - minLon) * 0.15, 0.005);

    return {
      minLat: minLat - latMargin,
      maxLat: maxLat + latMargin,
      minLon: minLon - lonMargin,
      maxLon: maxLon + lonMargin,
    };
  }, [trajectory]);

  const svgWidth = 440;
  const svgHeight = 160;

  const pointsSvg = useMemo(() => {
    if (trajectory.length === 0) return [];
    return trajectory.map((t) => {
      const x =
        ((t.longitude - bounds.minLon) / (bounds.maxLon - bounds.minLon || 1)) *
        (svgWidth - 40) +
        20;
      const y =
        (1 - (t.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) *
        (svgHeight - 40) +
        20;
      return { x, y, pt: t };
    });
  }, [trajectory, bounds, svgWidth, svgHeight]);

  const pathD = useMemo(() => {
    if (pointsSvg.length === 0) return '';
    return pointsSvg.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  }, [pointsSvg]);

  const selectedSvgPt = pointsSvg[Math.min(selectedIndex, pointsSvg.length - 1)];

  const getHoursAgo = (index: number) => {
    if (index === 0) return 'NOW';
    const totalMinutes = index * 15;
    const hours = Math.round(totalMinutes / 60);
    return `~${hours}h ago`;
  };

  return (
    <div className="flex flex-col gap-3.5 w-full font-sans bg-card/60 p-4 rounded-xl border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation size={15} className="text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Estimated Spill Path
          </span>
        </div>
        {currentPt && (
          <span className="text-[11px] font-mono text-muted-foreground">
            {formatIncidentDate(currentPt.timestamp)} ·{' '}
            <span className="text-primary font-bold">{getHoursAgo(selectedIndex)}</span>
          </span>
        )}
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full h-36 bg-background rounded-lg border border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--primary) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
          {/* Path line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            opacity="0.85"
          />

          {/* Milestone markers */}
          {pointsSvg.map((p, i) => {
            if (i !== 0 && i !== 16 && i !== 32 && i !== 48 && i !== pointsSvg.length - 1) return null;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="var(--card)"
                stroke="var(--primary)"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Selected Point Highlight */}
          {selectedSvgPt && (
            <g>
              <circle
                cx={selectedSvgPt.x}
                cy={selectedSvgPt.y}
                r="10"
                fill="var(--primary)"
                opacity="0.3"
                className="animate-ping"
              />
              <circle
                cx={selectedSvgPt.x}
                cy={selectedSvgPt.y}
                r="5.5"
                fill="var(--primary)"
                stroke="var(--card)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating coordinates tag */}
        {currentPt && (
          <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground border border-border flex items-center gap-1 font-semibold">
            <MapPin size={10} className="text-primary" />
            <span>
              {currentPt.latitude.toFixed(4)}°N, {currentPt.longitude.toFixed(4)}°E
            </span>
          </div>
        )}
      </div>

      {/* Timeline Scrubber */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground font-semibold">
          <span>~16h ago</span>
          <span>~12h ago</span>
          <span>~8h ago</span>
          <span>~4h ago</span>
          <span className="text-primary font-extrabold">NOW</span>
        </div>
        <input
          type="range"
          min={0}
          max={maxIdx}
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
};
