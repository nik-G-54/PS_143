// src/components/dashboard/SpillSizeDistribution.tsx

import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { useDashboardContext } from '../../context/DashboardContext';
import { buildSizeDistribution } from '../../utils/spillAnalytics';
import { SizeBucket } from '../../types/spill';

// OKLCH theme ramp — size badhe toh color gehra
const RAMP = [
  'oklch(0.9214 0.0248 257.65)',
  'oklch(0.7597 0.0804 267.01)',
  'oklch(0.6083 0.1247 272.72)',
  'oklch(0.5144 0.1605 267.44)',
  'oklch(0.2571 0.1161 272.24)',
];

export const SpillSizeDistribution: React.FC = () => {
  const { filteredSpills, filters, setFilters } = useDashboardContext();
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const buckets = useMemo(() => buildSizeDistribution(filteredSpills), [filteredSpills]);
  const total = useMemo(() => buckets.reduce((s, b) => s + b.count, 0), [buckets]);
  const activeKey = filters.selectedSizeBucket;

  const data = useMemo(
    () => buckets.map((b, i) => ({ ...b, fill: RAMP[i % RAMP.length] })),
    [buckets]
  );
  const activeBucket = data.find((d) => d.key === activeKey) ?? null;

  const handleBucketClick = (bucket: SizeBucket | null) => {
    if (!bucket) return;
    if (filters.selectedSizeBucket === bucket.key) {
      setFilters({ areaRange: null, selectedSizeBucket: null });
    } else {
      setFilters({
        areaRange: { min: bucket.minArea, max: bucket.maxArea },
        selectedSizeBucket: bucket.key,
      });
    }
  };

  // Slice ke andar exact count (white text) — sirf bade slices pe
  const renderCountLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
    if (percent < 0.07) return null;
    const rad = Math.PI / 180;
    const r = (innerRadius + outerRadius) / 2;
    return (
      <text
        x={cx + r * Math.cos(-midAngle * rad)}
        y={cy + r * Math.sin(-midAngle * rad)}
        fill="#fff" fontSize={12} fontWeight={700}
        textAnchor="middle" dominantBaseline="central"
        pointerEvents="none"
      >
        {value}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as any;
    const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0';
    return (
      <div className="bg-popover text-popover-foreground text-xs font-sans px-3 py-2 rounded-lg shadow-lg border border-border">
        <div className="font-bold text-foreground mb-1">{d.label}</div>
        <div className="space-y-0.5 font-mono text-[11px]">
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Spills:</span>
            <span className="font-bold">{d.count}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Share:</span>
            <span className="font-bold">{pct}%</span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1.5 pt-1 border-t border-border/40 italic">
          {activeKey === d.key ? 'Click to clear filter' : 'Click to filter map'}
        </div>
      </div>
    );
  };

  if (buckets.length === 0) {
    return (
      <ChartCard title="Spill Size Distribution" subtitle="Surface coverage area range breakdown">
        <div className="py-12 text-center text-xs text-muted-foreground font-mono">
          No data for selected filters
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Spill Size Distribution" subtitle="Surface coverage area range breakdown">
      {/* Donut + center overlay */}
      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%" cy="50%"
              innerRadius="70%"
              outerRadius="95%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={1.5}
              cornerRadius={8}
              stroke="transparent"
              label={renderCountLabel}
              labelLine={false}
              animationDuration={700}
              animationEasing="ease-out"
              onClick={(_: any, idx: number) => handleBucketClick(data[idx] ?? null)}
              onMouseEnter={(_: any, idx: number) => setHoverKey(data[idx]?.key ?? null)}
              onMouseLeave={() => setHoverKey(null)}
            >
              {data.map((d) => {
                const isActive = activeKey === d.key;
                const isHovered = hoverKey === d.key;
                const opacity = isActive || isHovered ? 1 : activeKey || hoverKey ? 0.15 : 1;
                return (
                  <Cell
                    key={d.key}
                    fill={d.fill}
                    fillOpacity={opacity}
                    stroke={isActive ? 'var(--card)' : 'transparent'}
                    strokeWidth={isActive ? 4 : 0}
                    style={{ cursor: 'pointer', transition: 'fill-opacity 180ms ease' }}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center dynamic metric */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-mono text-muted-foreground">
            {activeBucket ? activeBucket.label : 'Total spills'}
          </span>
          <span className="text-3xl font-bold leading-none font-mono text-foreground">
            {activeBucket ? activeBucket.count : total}
          </span>
          {activeBucket && total > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground mt-1">
              {((activeBucket.count / total) * 100).toFixed(1)}% of total
            </span>
          )}
        </div>
      </div>

      {/* Clickable legend chips */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {data.map((d) => {
          const isActive = activeKey === d.key;
          return (
            <button
              key={d.key}
              onClick={() => handleBucketClick(d)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono transition-all duration-150 ${
                isActive
                  ? 'border-transparent text-white'
                  : 'border-border bg-card/50 text-muted-foreground hover:bg-accent'
              }`}
              style={isActive ? { background: d.fill } : undefined}
            >
              <span>{d.label}</span>
              <b>{d.count}</b>
            </button>
          );
        })}
      </div>
    </ChartCard>
  );
};
