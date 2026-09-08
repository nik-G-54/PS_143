import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { Activity } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';
import { useSimulation } from '../../context/SimulationContext';

type ChartPoint = {
  t: number;
  label: string;
  latitude: number;
  longitude: number;
  hoursFromRelease: number;
};

function formatAxisTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const BacktrackTrajectoryChart: React.FC = () => {
  const { backtrackData } = useIncident();
  const { progress, direction } = useSimulation();

  const { points, releaseMs, obsMs, pathKm } = useMemo(() => {
    const traj = backtrackData?.backtrack.trajectory ?? [];
    const releaseMs = Date.parse(backtrackData?.backtrack.estimated_release_time ?? '');
    const obsMs = Date.parse(backtrackData?.backtrack.observation.timestamp ?? '');

    const points: ChartPoint[] = traj
      .map((pt) => {
        const t = Date.parse(pt.timestamp);
        return {
          t,
          label: formatAxisTime(pt.timestamp),
          latitude: pt.latitude,
          longitude: pt.longitude,
          hoursFromRelease: Number.isFinite(releaseMs) ? (t - releaseMs) / 3_600_000 : 0,
        };
      })
      .filter((p) => Number.isFinite(p.t))
      .sort((a, b) => a.t - b.t);

    let pathKm = 0;
    for (let i = 1; i < points.length; i++) {
      pathKm += haversineKm(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
    }

    return { points, releaseMs, obsMs, pathKm };
  }, [backtrackData]);

  const playheadMs = useMemo(() => {
    if (!Number.isFinite(releaseMs) || !Number.isFinite(obsMs)) return null;
    const p = direction === 'BACKTRACK' ? 1 - progress : progress;
    return releaseMs + (obsMs - releaseMs) * p;
  }, [releaseMs, obsMs, progress, direction]);

  const playheadHours = useMemo(() => {
    if (playheadMs == null || !Number.isFinite(releaseMs)) return null;
    return (playheadMs - releaseMs) / 3_600_000;
  }, [playheadMs, releaseMs]);

  if (points.length === 0) {
    return (
      <div className="h-full flex flex-col bg-card/90 border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-muted/30">
          <Activity size={13} className="text-amber-400" />
          <h3 className="text-[11px] font-semibold tracking-wider text-foreground">
            OIL BACKTRACK TRAJECTORY
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
          No trajectory points available for this incident
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card/90 border border-border rounded-lg overflow-hidden min-h-0">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-3 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity size={13} className="text-amber-400 shrink-0" />
          <h3 className="text-[11px] font-semibold tracking-wider text-foreground truncate">
            OIL BACKTRACK TRAJECTORY
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground shrink-0">
          <span>
            PATH <span className="text-amber-300">{pathKm.toFixed(1)} km</span>
          </span>
          <span>
            PTS <span className="text-cyan-300">{points.length}</span>
          </span>
          <span className="hidden sm:inline">
            MODE{' '}
            <span className="text-primary">{direction === 'BACKTRACK' ? 'BACKTRACK' : 'FORWARD'}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-1 pt-2 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="latFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.5144 0.1605 267.44)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="oklch(0.5144 0.1605 267.44)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="lonFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7597 0.0804 267.01)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="oklch(0.7597 0.0804 267.01)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
            <XAxis
              dataKey="hoursFromRelease"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => `+${Number(v).toFixed(0)}h`}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="lat"
              orientation="left"
              domain={['auto', 'auto']}
              tick={{ fill: '#fbbf24', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => Number(v).toFixed(3)}
            />
            <YAxis
              yAxisId="lon"
              orientation="right"
              domain={['auto', 'auto']}
              tick={{ fill: '#67e8f9', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v) => Number(v).toFixed(3)}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(148,163,184,0.25)',
                borderRadius: 8,
                fontSize: 11,
              }}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartPoint | undefined;
                return row ? `${row.label} UTC · T+${row.hoursFromRelease.toFixed(1)}h` : '';
              }}
              formatter={(value, name) => [
                `${Number(value ?? 0).toFixed(4)}°`,
                name === 'latitude' ? 'Latitude' : 'Longitude',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              formatter={(value) => (value === 'latitude' ? 'Latitude (°)' : 'Longitude (°)')}
            />
            <Area
              yAxisId="lat"
              type="monotone"
              dataKey="latitude"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#latFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              name="latitude"
            />
            <Line
              yAxisId="lon"
              type="monotone"
              dataKey="longitude"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              name="longitude"
            />
            {playheadHours != null && (
              <ReferenceLine
                yAxisId="lat"
                x={playheadHours}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                label={{
                  value: 'NOW',
                  position: 'insideTopLeft',
                  fill: '#f87171',
                  fontSize: 9,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
