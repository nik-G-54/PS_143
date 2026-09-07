// src/components/dashboard/SpillDetectionTrend.tsx

import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { useDashboardContext } from '../../context/DashboardContext';
import { buildTrendData } from '../../utils/spillAnalytics';
import { formatArea, formatConfidence } from '../../utils/formatters';
import { isSameDay } from '../../utils/dateUtils';

// ============================================
// TYPES
// ============================================
export type SeverityKey = 'minor' | 'severe' | 'critical';

// ============================================
// CONSTANTS
// ============================================
const COLORS: Record<SeverityKey, string> = {
  minor: '#eab308',
  severe: '#f97316',
  critical: '#ef4444',
};

const THRESHOLD_LEVEL = 15; // Alert when spills > 15

// ============================================
// CUSTOM TOOLTIP
// ============================================
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const minorVal = data.values?.minor ?? data.minor ?? 0;
  const severeVal = data.values?.severe ?? data.severe ?? 0;
  const criticalVal = data.values?.critical ?? data.critical ?? 0;
  const total = data.count ?? (minorVal + severeVal + criticalVal);
  const isOverThreshold = total > THRESHOLD_LEVEL;

  return (
    <div className="bg-popover text-popover-foreground text-xs font-sans px-3 py-2 rounded-lg shadow-lg border border-border">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-foreground">{data.displayDate}</span>
        {isOverThreshold && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500/20 text-red-400 rounded">
            ⚠️ ALERT
          </span>
        )}
      </div>
      <div className="space-y-0.5 font-mono text-[11px]">
        <div className="flex justify-between gap-4">
          <span style={{ color: COLORS.minor }}>Minor:</span>
          <span className="font-bold" style={{ color: COLORS.minor }}>{minorVal}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: COLORS.severe }}>Severe:</span>
          <span className="font-bold" style={{ color: COLORS.severe }}>{severeVal}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: COLORS.critical }}>Critical:</span>
          <span className="font-bold" style={{ color: COLORS.critical }}>{criticalVal}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-border/40">
          <span className="text-muted-foreground">Total:</span>
          <span className={`font-bold ${isOverThreshold ? 'text-red-400' : 'text-foreground'}`}>
            {total}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Area:</span>
          <span className="font-semibold">{formatArea(data.totalArea)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Confidence:</span>
          <span className="font-semibold">{formatConfidence(data.avgConfidence)}</span>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1.5 pt-1 border-t border-border/40 italic">
        Click point to filter date
      </div>
    </div>
  );
};

// ============================================
// CUSTOM LEGEND (with opacity toggle)
// ============================================
const CustomLegend = ({ payload, hiddenSeries, onToggle }: any) => (
  <div className="flex items-center gap-4 justify-between px-1 mb-2">
    {/* Severity toggles */}
    <div className="flex gap-3">
      {payload?.map((entry: any) => {
        const key = entry.dataKey as SeverityKey;
        const hidden = hiddenSeries.has(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className="flex items-center gap-1.5 text-xs transition-opacity duration-200 select-none hover:opacity-100"
            style={{ opacity: hidden ? 0.35 : 1 }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm transition-all duration-200"
              style={{
                backgroundColor: hidden ? 'transparent' : entry.color,
                border: `2px solid ${entry.color}`,
              }}
            />
            <span style={{ color: entry.color }}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </span>
          </button>
        );
      })}
    </div>

    {/* Threshold indicator */}
    <div className="flex items-center gap-1.5 text-xs">
      <span className="h-0 w-4 border-t-2 border-dashed border-red-500" />
      <span className="text-red-400 font-medium">Alert ({THRESHOLD_LEVEL})</span>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export const SpillDetectionTrend: React.FC = () => {
  const { filteredSpills, filters, setFilters } = useDashboardContext();
  const [hiddenSeries, setHiddenSeries] = useState<Set<SeverityKey>>(new Set());

  const trendData = useMemo(() => {
    const data = buildTrendData(filteredSpills);
    return data.map(d => {
      const vals = (d as any).values || {
        minor: Math.round(d.count * 0.4),
        severe: Math.round(d.count * 0.4),
        critical: Math.round(d.count * 0.2),
      };
      return {
        ...d,
        values: vals,
        minor: vals.minor ?? 0,
        severe: vals.severe ?? 0,
        critical: vals.critical ?? 0,
      };
    });
  }, [filteredSpills]);

  const yMax = useMemo(() => {
    if (trendData.length === 0) return 10;
    const maxes = trendData.map(d =>
      (d.minor ?? 0) + (d.severe ?? 0) + (d.critical ?? 0)
    );
    return Math.max(...maxes, THRESHOLD_LEVEL + 5);
  }, [trendData]);

  const handleToggle = (key: SeverityKey) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handlePointClick = (data: any) => {
    if (data?.date) {
      if (filters.selectedDate && isSameDay(filters.selectedDate, data.date)) {
        setFilters({ selectedDate: null });
      } else {
        setFilters({ selectedDate: data.date });
      }
    }
  };

  // Custom dot with click/hover + alert styling
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return null;

    const isSelected = filters.selectedDate && isSameDay(filters.selectedDate, payload.date);
    const total = payload.count ?? ((payload.minor ?? 0) + (payload.severe ?? 0) + (payload.critical ?? 0));
    const isOverThreshold = total > THRESHOLD_LEVEL;

    return (
      <g className="cursor-pointer" onClick={() => handlePointClick(payload)}>
        {/* Alert ring if over threshold */}
        {isOverThreshold && (
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill="none"
            stroke="#ef4444"
            strokeWidth={1}
            strokeDasharray="2 2"
            opacity={0.5}
          />
        )}
        {/* Selected pulse */}
        {isSelected && (
          <circle cx={cx} cy={cy} r={10} fill="var(--primary)" opacity={0.25} className="animate-ping" />
        )}
        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 6 : isOverThreshold ? 5 : 3.5}
          fill={isSelected ? 'var(--primary)' : isOverThreshold ? '#ef4444' : 'var(--card)'}
          stroke={isOverThreshold ? '#ef4444' : 'var(--primary)'}
          strokeWidth={isSelected || isOverThreshold ? 2.5 : 1.5}
          className="transition-all duration-150"
        />
      </g>
    );
  };

  return (
    <ChartCard title="Spill Detection Trend" subtitle="Daily satellite detection volume over time">
      {trendData.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground font-mono">
          No data for selected filters
        </div>
      ) : (
        <div className="relative w-full overflow-hidden select-none">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              onClick={(e: any) => e?.activePayload?.[0]?.payload && handlePointClick(e.activePayload[0].payload)}
            >
              <defs>
                <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.critical} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.critical} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="gradSevere" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.severe} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.severe} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="gradMinor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.minor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.minor} stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />

              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickFormatter={(val) => val?.split(',')[0]}
                interval="preserveStartEnd"
              />

              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                domain={[0, yMax]}
                allowDataOverflow
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                content={<CustomLegend hiddenSeries={hiddenSeries} onToggle={handleToggle} />}
              />

              {/* ============================================
                  THRESHOLD LINE — Alert at 15 spills
                  ============================================ */}
              <ReferenceLine
                y={THRESHOLD_LEVEL}
                stroke="#ef4444"
                strokeDasharray="6 3"
                strokeWidth={2}
                label={{
                  value: `⚠️ ${THRESHOLD_LEVEL}`,
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
              />

              {/* Stacked Areas */}
              <Area
                type="monotone"
                dataKey="minor"
                stackId="1"
                stroke={COLORS.minor}
                fill="url(#gradMinor)"
                strokeWidth={2}
                dot={false}
                activeDot={<CustomDot />}
                connectNulls
                hide={hiddenSeries.has('minor')}
              />

              <Area
                type="monotone"
                dataKey="severe"
                stackId="1"
                stroke={COLORS.severe}
                fill="url(#gradSevere)"
                strokeWidth={2}
                dot={false}
                activeDot={<CustomDot />}
                connectNulls
                hide={hiddenSeries.has('severe')}
              />

              <Area
                type="monotone"
                dataKey="critical"
                stackId="1"
                stroke={COLORS.critical}
                fill="url(#gradCritical)"
                strokeWidth={2}
                dot={false}
                activeDot={<CustomDot />}
                connectNulls
                hide={hiddenSeries.has('critical')}
              />

              {/* ============================================
                  BRUSH — Time range zoom
                  ============================================ */}
              <Brush
                dataKey="displayDate"
                height={35}
                stroke="var(--primary)"
                fill="var(--muted, #1e293b)"
                travellerWidth={10}
                tickFormatter={(val) => val?.split(',')[0]}
                startIndex={0}
                endIndex={trendData.length - 1}
              >
                {/* Mini chart inside brush */}
                <AreaChart>
                  <Area
                    type="monotone"
                    dataKey="critical"
                    stroke={COLORS.critical}
                    fill={COLORS.critical}
                    fillOpacity={0.3}
                    dot={false}
                  />
                </AreaChart>
              </Brush>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
};
