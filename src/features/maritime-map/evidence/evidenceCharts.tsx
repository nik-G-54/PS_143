import { useMemo } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory, SpillEnvironment } from '../types/trajectoryTypes';
import type { AttributedVessel, VesselSubScores } from '../types/attributionTypes';
import type { SpillForecast } from '../types/forecastTypes';
import { haversineKm } from '../utils/geo';

// Evidence-dossier charts. Plotted values come straight off backend
// responses; the only derivations are geometry (distance/speed between
// consecutive drift or AIS samples) and counts over the spills list.

export const AXIS_TICK = { fontSize: 10, fill: 'var(--muted-foreground)' };
export const TOOLTIP_STYLE = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 11,
  color: 'var(--foreground)',
  boxShadow: '0 6px 16px -6px rgba(0,0,0,0.35)',
};
const GRID_STROKE = 'var(--border)';

/** Rank-1 always takes the theme primary; the rest get muted, distinguishable tones. */
const COMPETITOR_COLORS = ['#94a3b8', '#c8963e', '#5eaaa8', '#a78bfa'];
export function vesselColor(index: number): string {
  return index === 0 ? 'var(--primary)' : COMPETITOR_COLORS[(index - 1) % COMPETITOR_COLORS.length];
}

export const SIGNALS: { key: keyof VesselSubScores; label: string }[] = [
  { key: 'proximity', label: 'Proximity' },
  { key: 'approach', label: 'Approach' },
  { key: 'temporal', label: 'Timing' },
  { key: 'departure', label: 'Departure' },
  { key: 'loiter', label: 'Loiter' },
  { key: 'slowdown', label: 'Slowdown' },
];

const pct = (v: number | null | undefined) => (v == null ? null : Math.round(v * 100));

/* ------------------------------------------------------------------ */
/* Detection                                                           */
/* ------------------------------------------------------------------ */

/** Semicircular gauge for a 0..1 score. Plain SVG — one number doesn't need a chart engine. */
export function ScoreGauge({ value, label }: { value: number | null; label: string }) {
  const v = value == null ? 0 : Math.max(0, Math.min(1, value));
  const r = 52;
  const circumference = Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 132 76" className="w-full max-w-[180px]" role="img" aria-label={`${label} ${pct(value) ?? '—'}%`}>
        <path d="M 14 68 A 52 52 0 0 1 118 68" fill="none" stroke="var(--muted)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 14 68 A 52 52 0 0 1 118 68"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference * v} ${circumference}`}
          className="maritime-gauge-arc"
        />
        <text x="66" y="62" textAnchor="middle" className="fill-foreground font-mono" fontSize="20" fontWeight="700">
          {value == null ? '—' : `${pct(value)}%`}
        </text>
      </svg>
      <span className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drift                                                               */
/* ------------------------------------------------------------------ */

/** Drift speed per backtrack segment + cumulative distance, origin → detection. */
export function DriftProfileChart({ trajectory }: { trajectory: SpillTrajectory }) {
  const data = useMemo(() => {
    const pts = trajectory.points;
    const t0 = pts[0]?.timestampMs ?? 0;
    return pts.map((p, i) => {
      const prev = pts[i - 1];
      let speedKmh: number | null = null;
      if (prev) {
        const dtH = (p.timestampMs - prev.timestampMs) / 3_600_000;
        if (dtH > 0) speedKmh = haversineKm(prev.longitude, prev.latitude, p.longitude, p.latitude) / dtH;
      }
      return {
        hours: Number(((p.timestampMs - t0) / 3_600_000).toFixed(2)),
        cumulativeKm: Number(p.cumulativeKm.toFixed(2)),
        speedKmh: speedKmh == null ? null : Number(speedKmh.toFixed(2)),
      };
    });
  }, [trajectory]);

  return (
    <ResponsiveContainer width="100%" height={230}>
      <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 4, left: -6 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="hours" type="number" domain={['dataMin', 'dataMax']} tick={AXIS_TICK} tickFormatter={(h: number) => `${h.toFixed(0)}h`} />
        <YAxis yAxisId="km" tick={AXIS_TICK} width={44} unit=" km" />
        <YAxis yAxisId="spd" orientation="right" tick={AXIS_TICK} width={48} unit=" km/h" />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(h) => `${Number(h).toFixed(1)} h after release`}
          formatter={(value, name) =>
            name === 'cumulativeKm' ? [`${Number(value).toFixed(2)} km`, 'Distance drifted'] : [`${Number(value).toFixed(2)} km/h`, 'Drift speed']
          }
        />
        <Area yAxisId="km" type="monotone" dataKey="cumulativeKm" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.14} strokeWidth={1.75} dot={false} />
        <Line yAxisId="spd" type="monotone" dataKey="speedKmh" stroke="#c8963e" strokeWidth={1.25} dot={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function Arrow({ deg, color, length, label }: { deg: number; color: string; length: number; label: string }) {
  return (
    <g transform={`rotate(${deg} 60 60)`}>
      <line x1="60" y1="60" x2="60" y2={60 - length} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M 60 ${60 - length - 7} L 55 ${60 - length + 2} L 65 ${60 - length + 2} Z`} fill={color} />
      <title>{label}</title>
    </g>
  );
}

/** Wind / current direction on one compass rose — directions as the backend reports them. */
export function ForcingCompass({ environment }: { environment: SpillEnvironment | null }) {
  const wind = environment?.wind ?? null;
  const current = environment?.current ?? null;
  if (!wind && !current) {
    return <p className="text-xs text-muted-foreground">No wind or current vectors reported for this detection.</p>;
  }
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label="Wind and current direction">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" />
        <circle cx="60" cy="60" r="34" fill="none" stroke="var(--border)" strokeDasharray="2 3" />
        {['N', 'E', 'S', 'W'].map((d, i) => (
          <text key={d} x={60 + Math.sin((i * Math.PI) / 2) * 44} y={64 - Math.cos((i * Math.PI) / 2) * 44} textAnchor="middle" fontSize="9" className="fill-muted-foreground font-mono">
            {d}
          </text>
        ))}
        {wind && <Arrow deg={wind.directionDeg} color="#38bdf8" length={36} label={`Wind ${wind.directionDeg.toFixed(0)}°`} />}
        {current && <Arrow deg={current.directionDeg} color="#2dd4bf" length={24} label={`Current ${current.directionDeg.toFixed(0)}°`} />}
        <circle cx="60" cy="60" r="3" className="fill-foreground" />
      </svg>
      <dl className="grid flex-1 gap-2 text-xs">
        {wind && (
          <div>
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-0.5 w-3 bg-sky-400" /> Wind
            </dt>
            <dd className="font-mono tabular-nums text-foreground">
              {wind.speed.toFixed(1)} {wind.unit} · {wind.directionDeg.toFixed(0)}°
            </dd>
          </div>
        )}
        {current && (
          <div>
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-0.5 w-3 bg-teal-400" /> Surface current
            </dt>
            <dd className="font-mono tabular-nums text-foreground">
              {current.speed.toFixed(2)} {current.unit} · {current.directionDeg.toFixed(0)}°
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Attribution — all candidates                                        */
/* ------------------------------------------------------------------ */

function vesselKey(i: number) {
  return `v${i}`;
}

/** Grouped bars: every candidate side by side on the overall score and each signal. */
export function SignalMatrixChart({ vessels }: { vessels: AttributedVessel[] }) {
  const data = useMemo(() => {
    const rows = [{ label: 'Overall', get: (v: AttributedVessel) => v.score }, ...SIGNALS.map((s) => ({ label: s.label, get: (v: AttributedVessel) => v.subScores[s.key] }))];
    return rows.map((row) => {
      const out: Record<string, string | number | null> = { signal: row.label };
      vessels.forEach((v, i) => {
        out[vesselKey(i)] = pct(row.get(v));
      });
      return out;
    });
  }, [vessels]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%" barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="signal" tick={{ ...AXIS_TICK, fill: 'var(--foreground)' }} interval={0} />
        <YAxis domain={[0, 100]} tick={AXIS_TICK} unit="%" width={44} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
          formatter={(value, name) => {
            const idx = Number(String(name).slice(1));
            const v = vessels[idx];
            return [value == null ? 'not reported' : `${value}%`, v ? `#${v.rank} ${v.vesselName}` : String(name)];
          }}
        />
        {vessels.map((v, i) => (
          <Bar key={v.vesselId} dataKey={vesselKey(i)} fill={vesselColor(i)} radius={[2, 2, 0, 0]} maxBarSize={16} fillOpacity={i === 0 ? 1 : 0.85} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Overlaid evidence profiles — rank #1 filled, competitors as outlines. */
export function CandidateRadarOverlay({ vessels }: { vessels: AttributedVessel[] }) {
  const data = useMemo(
    () =>
      SIGNALS.map((s) => {
        const out: Record<string, string | number> = { signal: s.label };
        vessels.forEach((v, i) => {
          out[vesselKey(i)] = pct(v.subScores[s.key]) ?? 0;
        });
        return out;
      }),
    [vessels]
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="72%" margin={{ top: 6, right: 24, bottom: 6, left: 24 }}>
        <PolarGrid stroke={GRID_STROKE} />
        <PolarAngleAxis dataKey="signal" tick={{ fontSize: 10, fill: 'var(--foreground)' }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {[...vessels].reverse().map((v) => {
          const i = vessels.indexOf(v);
          return (
            <Radar
              key={v.vesselId}
              dataKey={vesselKey(i)}
              stroke={vesselColor(i)}
              fill={vesselColor(i)}
              fillOpacity={i === 0 ? 0.28 : 0}
              strokeWidth={i === 0 ? 2 : 1.25}
              strokeDasharray={i === 0 ? undefined : '4 3'}
            />
          );
        })}
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, name) => {
            const v = vessels[Number(String(name).slice(1))];
            return [`${value}%`, v ? `#${v.rank} ${v.vesselName}` : String(name)];
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export interface LeadRow {
  signal: string;
  margin: number;
  leader: number;
  runnerUp: number;
  runnerUpName: string;
}

/** Rank #1's score minus the best competitor's, per signal (percentage points). */
export function computeLeadMargins(vessels: AttributedVessel[]): LeadRow[] {
  const [top, ...rest] = vessels;
  if (!top || rest.length === 0) return [];
  const rows: LeadRow[] = [];
  const signals = [{ label: 'Overall', get: (v: AttributedVessel) => v.score }, ...SIGNALS.map((s) => ({ label: s.label, get: (v: AttributedVessel) => v.subScores[s.key] }))];
  for (const s of signals) {
    const mine = s.get(top);
    if (mine == null) continue;
    let best: AttributedVessel | null = null;
    for (const v of rest) {
      const val = s.get(v);
      if (val != null && (best == null || val > (s.get(best) as number))) best = v;
    }
    if (!best) continue;
    const theirs = s.get(best) as number;
    rows.push({
      signal: s.label,
      margin: Math.round((mine - theirs) * 100),
      leader: Math.round(mine * 100),
      runnerUp: Math.round(theirs * 100),
      runnerUpName: best.vesselName,
    });
  }
  return rows;
}

/** Diverging bars: where #1 out-scores every other candidate (green) and where it doesn't (amber). */
export function LeadMarginChart({ rows }: { rows: LeadRow[] }) {
  const extent = Math.max(20, ...rows.map((r) => Math.abs(r.margin)));
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 32 + 30)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
        <XAxis type="number" domain={[-extent, extent]} tick={AXIS_TICK} tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}`} />
        <YAxis type="category" dataKey="signal" width={74} tick={{ ...AXIS_TICK, fill: 'var(--foreground)' }} />
        <ReferenceLine x={0} stroke="var(--foreground)" strokeOpacity={0.6} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
          formatter={(_v, _n, item) => {
            const r = item?.payload as LeadRow;
            return [`#1 ${r.leader}% vs ${r.runnerUp}% (${r.runnerUpName})`, `${r.margin > 0 ? '+' : ''}${r.margin} pts`];
          }}
        />
        <Bar dataKey="margin" barSize={14} radius={2}>
          {rows.map((r) => (
            <Cell key={r.signal} fill={r.margin >= 0 ? '#4e9a6e' : '#d99e3a'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Where each candidate was, relative to the release: time offset vs distance, bubble = score. */
export function SpatioTemporalScatter({
  vessels,
  windowHours,
  corridorKm,
}: {
  vessels: AttributedVessel[];
  windowHours: number | null;
  corridorKm: number | null;
}) {
  const series = vessels
    .map((v, i) => ({
      v,
      i,
      point:
        v.timeDifferenceHours != null && v.distanceFromOriginKm != null
          ? [{ x: v.timeDifferenceHours, y: v.distanceFromOriginKm, z: pct(v.score) ?? 0, name: v.vesselName, rank: v.rank }]
          : [],
    }))
    .filter((s) => s.point.length > 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 10, right: 16, bottom: 16, left: -6 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        {windowHours != null && corridorKm != null && (
          <ReferenceArea x1={-windowHours} x2={windowHours} y1={0} y2={corridorKm} fill="#4e9a6e" fillOpacity={0.08} stroke="#4e9a6e" strokeOpacity={0.4} strokeDasharray="4 3" ifOverflow="extendDomain" />
        )}
        <ReferenceLine x={0} stroke="var(--foreground)" strokeDasharray="4 3" strokeOpacity={0.6} label={{ value: 'Release', position: 'top', fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <XAxis type="number" dataKey="x" name="Time offset" unit=" h" tick={AXIS_TICK} label={{ value: 'Time offset from release (h)', position: 'insideBottom', offset: -10, fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis type="number" dataKey="y" name="Distance" unit=" km" tick={AXIS_TICK} width={52} />
        <ZAxis type="number" dataKey="z" range={[60, 420]} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value, name) => {
            if (name === 'Time offset') return [`${Number(value).toFixed(2)} h`, 'Time offset'];
            if (name === 'Distance') return [`${Number(value).toFixed(2)} km`, 'Distance to origin'];
            return [`${value}%`, 'Score'];
          }}
          labelFormatter={() => ''}
        />
        {series.map(({ v, i, point }) => (
          <Scatter key={v.vesselId} name={`#${v.rank} ${v.vesselName}`} data={point} fill={vesselColor(i)} fillOpacity={i === 0 ? 0.95 : 0.7} stroke={i === 0 ? 'var(--card)' : undefined} strokeWidth={i === 0 ? 2 : 0} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Forecast                                                            */
/* ------------------------------------------------------------------ */

export function ForecastProfileChart({ forecast }: { forecast: SpillForecast }) {
  const data = useMemo(
    () =>
      forecast.points.map((p) => ({
        hours: Number(p.hoursFromNow.toFixed(2)),
        cumulativeKm: Number(p.cumulativeKm.toFixed(2)),
        speed: p.driftSpeedKnots,
      })),
    [forecast]
  );
  const hasSpeed = data.some((d) => d.speed != null);
  return (
    <ResponsiveContainer width="100%" height={230}>
      <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 4, left: -6 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="hours" type="number" domain={['dataMin', 'dataMax']} tick={AXIS_TICK} tickFormatter={(h: number) => `+${h.toFixed(0)}h`} />
        <YAxis yAxisId="km" tick={AXIS_TICK} width={44} unit=" km" />
        {hasSpeed && <YAxis yAxisId="kn" orientation="right" tick={AXIS_TICK} width={40} unit=" kn" />}
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(h) => `+${Number(h).toFixed(1)} h`}
          formatter={(value, name) => (name === 'cumulativeKm' ? [`${Number(value).toFixed(2)} km`, 'Predicted drift'] : [`${Number(value).toFixed(2)} kn`, 'Drift speed'])}
        />
        <Area yAxisId="km" type="monotone" dataKey="cumulativeKm" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.14} strokeWidth={1.75} dot={false} />
        {hasSpeed && <Line yAxisId="kn" type="monotone" dataKey="speed" stroke="#c8963e" strokeWidth={1.25} dot={false} connectNulls />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Regional context — the full detections list                        */
/* ------------------------------------------------------------------ */

const MONTH_FMT = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export function DetectionTimelineChart({ spills, selected }: { spills: MapSpill[]; selected: MapSpill }) {
  const data = useMemo(() => {
    const counts = new Map<string, { t: number; count: number }>();
    for (const s of spills) {
      if (s.detectedAtMs == null) continue;
      const d = new Date(s.detectedAtMs);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
      const row = counts.get(key) ?? { t, count: 0 };
      row.count += 1;
      counts.set(key, row);
    }
    const selKey =
      selected.detectedAtMs != null
        ? `${new Date(selected.detectedAtMs).getUTCFullYear()}-${String(new Date(selected.detectedAtMs).getUTCMonth() + 1).padStart(2, '0')}`
        : null;
    return [...counts.entries()]
      .sort((a, b) => a[1].t - b[1].t)
      .map(([key, row]) => ({ month: MONTH_FMT.format(row.t), count: row.count, isSelected: key === selKey }));
  }, [spills, selected]);

  if (data.length === 0) return <p className="text-xs text-muted-foreground">No dated detections.</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="month" tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={12} />
        <YAxis tick={AXIS_TICK} allowDecimals={false} width={40} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} formatter={(v) => [v, 'Detections']} />
        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.month} fill={d.isSelected ? 'var(--primary)' : 'var(--muted-foreground)'} fillOpacity={d.isSelected ? 1 : 0.45} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const AREA_BINS = [0, 1, 2, 5, 10, 20, 50, Infinity];

export function areaPercentile(spills: MapSpill[], area: number | null): number | null {
  if (area == null) return null;
  const areas = spills.map((s) => s.areaKm2).filter((a): a is number => a != null);
  if (areas.length === 0) return null;
  return Math.round((areas.filter((a) => a <= area).length / areas.length) * 100);
}

export function AreaDistributionChart({ spills, selected }: { spills: MapSpill[]; selected: MapSpill }) {
  const data = useMemo(() => {
    return AREA_BINS.slice(0, -1).map((lo, i) => {
      const hi = AREA_BINS[i + 1];
      const count = spills.filter((s) => s.areaKm2 != null && s.areaKm2 >= lo && s.areaKm2 < hi).length;
      const isSelected = selected.areaKm2 != null && selected.areaKm2 >= lo && selected.areaKm2 < hi;
      return { bin: hi === Infinity ? `${lo}+` : `${lo}–${hi}`, count, isSelected };
    });
  }, [spills, selected]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 12, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="bin" tick={AXIS_TICK} label={{ value: 'Slick area (km²)', position: 'insideBottom', offset: -8, fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={AXIS_TICK} allowDecimals={false} width={40} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} formatter={(v) => [v, 'Detections']} labelFormatter={(l) => `${l} km²`} />
        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.bin} fill={d.isSelected ? 'var(--primary)' : 'var(--muted-foreground)'} fillOpacity={d.isSelected ? 1 : 0.45} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
