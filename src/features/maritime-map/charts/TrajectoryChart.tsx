import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SpillTrajectory } from '../types/trajectoryTypes';
import { formatDistanceKm, formatDriftWindow } from '../utils/formatTrajectory';

interface TrajectoryChartProps {
  trajectory: SpillTrajectory | null;
  /** Playhead time in ms — draws a vertical reference via the nearest point highlight. */
  currentTimeMs?: number | null;
}

type ChartRow = {
  hoursBefore: number;
  cumulativeKm: number;
  latitude: number;
  longitude: number;
  label: string;
};

function formatHours(hours: number): string {
  if (hours < 0.05) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

/**
 * Scientific trajectory chart from the real backtrack samples — not a decorative line.
 * X = hours before detection (backtrack age), Y = cumulative drift distance (km).
 */
export function TrajectoryChart({ trajectory, currentTimeMs }: TrajectoryChartProps) {
  const data = useMemo<ChartRow[]>(() => {
    if (!trajectory) return [];
    return trajectory.points.map((point) => ({
      hoursBefore: Number(point.hoursBeforeDetection.toFixed(3)),
      cumulativeKm: Number(point.cumulativeKm.toFixed(3)),
      latitude: point.latitude,
      longitude: point.longitude,
      label: new Date(point.timestampMs).toISOString().slice(11, 16) + 'Z',
    }));
  }, [trajectory]);

  const playheadHours = useMemo(() => {
    if (!trajectory || currentTimeMs == null) return null;
    const end = trajectory.points[trajectory.points.length - 1]?.timestampMs;
    if (end == null) return null;
    return (end - currentTimeMs) / 3_600_000;
  }, [trajectory, currentTimeMs]);

  if (!trajectory || data.length < 2) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-border bg-card/60 text-xs text-muted-foreground">
        Trajectory chart awaits drift samples.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[220px] flex-col rounded-lg border border-border bg-card/80">
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-3 py-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Oil drift trajectory
          </p>
          <p className="mt-0.5 text-[11px] text-foreground">
            {formatDistanceKm(trajectory.totalDistanceKm)} over{' '}
            {formatDriftWindow(trajectory.durationHours)}
          </p>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          {trajectory.points.length} samples · real backtrack
        </p>
      </div>

      <div className="flex-1 px-1 pb-2 pt-3" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
            <XAxis
              dataKey="hoursBefore"
              type="number"
              reversed
              tickFormatter={formatHours}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              label={{
                value: 'Hours before detection ←',
                position: 'insideBottom',
                offset: -2,
                style: { fontSize: 10, fill: 'var(--muted-foreground)' },
              }}
            />
            <YAxis
              dataKey="cumulativeKm"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              width={42}
              label={{
                value: 'km',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'var(--muted-foreground)' },
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value, name) => {
                if (name === 'cumulativeKm') return [`${Number(value).toFixed(2)} km`, 'Path length'];
                if (name === 'latitude') return [Number(value).toFixed(4), 'Latitude'];
                return [String(value), String(name)];
              }}
              labelFormatter={(label) => `${formatHours(Number(label))} before detection`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area
              type="monotone"
              dataKey="cumulativeKm"
              name="Cumulative drift"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.2}
              strokeWidth={2}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="latitude"
              name="Latitude"
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="4 3"
              yAxisId={0}
              hide
              isAnimationActive={false}
              dot={false}
            />
            {playheadHours != null && (
              <Line
                dataKey="cumulativeKm"
                stroke="transparent"
                legendType="none"
                isAnimationActive={false}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (
                    payload &&
                    Math.abs(payload.hoursBefore - playheadHours) <
                      trajectory.durationHours / trajectory.points.length
                  ) {
                    return (
                      <circle
                        key={`ph-${payload.hoursBefore}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#f97316"
                        stroke="#fff"
                        strokeWidth={1.5}
                      />
                    );
                  }
                  return null;
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
