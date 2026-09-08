// src/components/dashboard/ConfidenceDistribution.tsx

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { useDashboardContext } from '../../context/DashboardContext';
import { buildConfidenceDistribution } from '../../utils/spillAnalytics';
import { ConfidenceBucket } from '../../types/spill';

interface ChartDatum extends ConfidenceBucket {
  fill: string;
}

// Terracotta ramp — low conf halka, high conf gehra
const RAMP = ['#eab59a', '#df9166', '#c45536', '#8f341c', '#5f1e0d'];

const sameRange = (b: ConfidenceBucket, r: { min: number; max: number } | null) =>
  r !== null && r.min === b.minConfidence && r.max === b.maxConfidence;

export const ConfidenceDistribution: React.FC = () => {
  const ctx = useDashboardContext();
  const { filters, setFilters } = ctx;

  // 📌 STATIC: full raw data (filters se chart nahi badlega)
  // Agar context me variable ka naam alag hai toh yahan badal do
  const sourceSpills = (ctx as any).spills ?? ctx.filteredSpills;

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const buckets = useMemo(
    () => buildConfidenceDistribution(sourceSpills),
    [sourceSpills]
  );

  const data = useMemo<ChartDatum[]>(
    () => buckets.map((b, i) => ({ ...b, fill: RAMP[i % RAMP.length] })),
    [buckets]
  );

  const total = useMemo(() => data.reduce((s, b) => s + b.count, 0), [data]);

  // Weighted estimate of avg confidence from bin midpoints
  const estAvg = useMemo(() => {
    if (!total) return 0;
    const sum = data.reduce(
      (s, b) => s + b.count * ((b.minConfidence + b.maxConfidence) / 2),
      0
    );
    return Math.round(sum / total);
  }, [data, total]);

  const selected = data.find((b) => sameRange(b, filters.confidenceRange)) ?? null;

  const handleBucketClick = (bucket?: ConfidenceBucket) => {
    if (!bucket) return;
    if (sameRange(bucket, filters.confidenceRange)) {
      setFilters({ confidenceRange: null });
    } else {
      setFilters({
        confidenceRange: { min: bucket.minConfidence, max: bucket.maxConfidence },
      });
    }
  };

  const cellOpacity = (b: ChartDatum) => {
    if (selected) return selected.key === b.key ? 1 : 0.15;
    if (hoveredKey) return hoveredKey === b.key ? 1 : 0.4;
    return 0.9;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as ChartDatum;
    const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0';
    return (
      <div className="bg-popover text-popover-foreground text-xs font-sans px-3 py-2 rounded-lg shadow-lg border border-border">
        <div className="font-bold text-foreground mb-1">{d.label} confidence</div>
        <div className="space-y-0.5 font-mono text-[11px]">
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Detections:</span>
            <span className="font-bold text-primary">{d.count}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Share:</span>
            <span className="font-semibold">{pct}%</span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground font-sans mt-1.5 pt-1 border-t border-border/40 italic">
          Click bar to filter
        </div>
      </div>
    );
  };

  return (
    <ChartCard title="Confidence Distribution" subtitle="AI detection confidence score levels">
      {data.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground font-mono">
          No data available
        </div>
      ) : (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={data} margin={{ top: 26, right: 12, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="confBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c45536" stopOpacity={1} />
                  <stop offset="100%" stopColor="#7a2e18" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'monospace', fontWeight: 600 }}
              />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                onClick={(entry: any) => handleBucketClick(entry?.payload)}
                onMouseEnter={(entry: any) => setHoveredKey(entry?.payload?.key ?? null)}
                onMouseLeave={() => setHoveredKey(null)}
                className="cursor-pointer"
                maxBarSize={64}
              >
                {data.map((b) => (
                  <Cell
                    key={b.key}
                    fill={b.fill}
                    fillOpacity={cellOpacity(b)}
                    stroke={selected?.key === b.key ? 'var(--foreground)' : 'transparent'}
                    strokeWidth={selected?.key === b.key ? 2 : 0}
                    style={{ transition: 'fill-opacity 160ms ease' }}
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  style={{ fill: '#c45536', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}
                />
              </Bar>

              {/* Subtle dashed trend */}
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--muted-foreground)"
                strokeOpacity={0.7}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Footer summary */}
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
            <div className="flex items-center gap-4">
              <span>
                Total <b className="text-foreground">{total}</b>
              </span>
              <span>
                Est. avg <b className="text-foreground">{estAvg}%</b>
              </span>
            </div>
            {selected && (
              <button
                onClick={() => setFilters({ confidenceRange: null })}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Clear {selected.label} filter ✕
              </button>
            )}
          </div>
        </div>
      )}
    </ChartCard>
  );
};
