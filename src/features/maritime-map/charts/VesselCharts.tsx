import { useMemo } from 'react';
import {
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
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AttributedVessel, VesselSubScores } from '../types/attributionTypes';
import { haversineKm } from '../utils/geo';

// Charts for the Vessel details module. Every plotted value is read straight
// off the backend's /vessels + /attribution/trajectory response (sub-scores,
// AIS track samples); the only derivation is great-circle distance from each
// AIS sample to the backend's own origin estimate — geometry, not scoring.

const AXIS_TICK = { fontSize: 9, fill: 'var(--muted-foreground)' };
const TOOLTIP_STYLE = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 11,
  color: 'var(--foreground)',
};
const VESSEL_AMBER = '#d99e3a';

function ChartFrame({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <section className="maritime-panel-card p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      {caption && <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{caption}</p>}
      <div className="mt-2">{children}</div>
    </section>
  );
}

const SUB_SCORE_AXES: { key: keyof VesselSubScores; label: string }[] = [
  { key: 'proximity', label: 'Proximity' },
  { key: 'approach', label: 'Approach' },
  { key: 'temporal', label: 'Timing' },
  { key: 'departure', label: 'Departure' },
  { key: 'loiter', label: 'Loiter' },
  { key: 'slowdown', label: 'Slowdown' },
];

/** Six-axis evidence profile — which signals carry the overall score and which don't. */
export function VesselScoreRadar({ vessel }: { vessel: AttributedVessel }) {
  const data = useMemo(
    () =>
      SUB_SCORE_AXES.map((axis) => ({
        signal: axis.label,
        value: vessel.subScores[axis.key] != null ? Math.round((vessel.subScores[axis.key] as number) * 100) : 0,
        reported: vessel.subScores[axis.key] != null,
      })),
    [vessel]
  );

  if (!data.some((d) => d.reported)) return null;

  return (
    <ChartFrame title="Evidence profile" caption="Backend sub-scores behind the overall match score (0–100).">
      <ResponsiveContainer width="100%" height={190}>
        <RadarChart data={data} outerRadius="70%" margin={{ top: 4, right: 18, bottom: 4, left: 18 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="signal" tick={{ fontSize: 9, fill: 'var(--foreground)' }} />
          <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.25}
            strokeWidth={1.5}
            dot={{ r: 2, fill: 'var(--primary)' }}
            isAnimationActive
            animationDuration={600}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, _name, item) =>
              (item?.payload as { reported?: boolean })?.reported ? [`${value}%`, 'Score'] : ['not reported', 'Score']
            }
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

interface ApproachRow {
  hours: number;
  distanceKm: number;
  speedKn: number | null;
}

/**
 * Distance-to-origin and speed across the vessel's AIS track, on a time axis
 * centred on the spill release — shows the approach, closest pass and
 * departure the Approach/Departure/Slowdown sub-scores summarise.
 */
export function VesselApproachChart({
  vessel,
  origin,
  releaseTimeMs,
  driftRadiusKm,
}: {
  vessel: AttributedVessel;
  origin: { longitude: number; latitude: number } | null;
  releaseTimeMs: number | null;
  driftRadiusKm: number | null;
}) {
  const data = useMemo<ApproachRow[]>(() => {
    if (!origin || releaseTimeMs == null || vessel.track.length < 2) return [];
    return vessel.track.map((p) => ({
      hours: Number(((p.timestampMs - releaseTimeMs) / 3_600_000).toFixed(3)),
      distanceKm: Number(haversineKm(origin.longitude, origin.latitude, p.longitude, p.latitude).toFixed(3)),
      speedKn: p.speed,
    }));
  }, [vessel, origin, releaseTimeMs]);

  if (data.length < 2) {
    return (
      <ChartFrame title="Approach & departure">
        <p className="text-[11px] text-muted-foreground">
          Arm the drift backtrack to load this vessel&apos;s AIS track around the release time.
        </p>
      </ChartFrame>
    );
  }

  const closest = data.reduce((best, row) => (row.distanceKm < best.distanceKm ? row : best), data[0]);
  const hasSpeed = data.some((d) => d.speedKn != null);

  return (
    <ChartFrame
      title="Approach & departure"
      caption={`Closest pass ${closest.distanceKm.toFixed(2)} km at ${closest.hours >= 0 ? '+' : ''}${closest.hours.toFixed(1)} h from release.`}
    >
      <ResponsiveContainer width="100%" height={170}>
        <ComposedChart data={data} margin={{ top: 6, right: hasSpeed ? 0 : 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="hours"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={AXIS_TICK}
            tickFormatter={(h: number) => `${h > 0 ? '+' : ''}${h.toFixed(0)}h`}
          />
          <YAxis yAxisId="km" tick={AXIS_TICK} width={36} tickFormatter={(v: number) => `${v}`} unit="km" />
          {hasSpeed && (
            <YAxis yAxisId="kn" orientation="right" tick={AXIS_TICK} width={32} unit="kn" />
          )}
          {driftRadiusKm != null && (
            <ReferenceArea
              yAxisId="km"
              y1={0}
              y2={driftRadiusKm}
              fill="#4e9a6e"
              fillOpacity={0.12}
              stroke="none"
              ifOverflow="extendDomain"
            />
          )}
          <ReferenceLine
            yAxisId="km"
            x={0}
            stroke="var(--foreground)"
            strokeDasharray="4 3"
            label={{ value: 'Release', position: 'insideTopRight', fontSize: 9, fill: 'var(--muted-foreground)' }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(h) => `${Number(h) >= 0 ? '+' : ''}${Number(h).toFixed(2)} h from release`}
            formatter={(value, name) =>
              name === 'distanceKm'
                ? [`${Number(value).toFixed(2)} km`, 'To origin']
                : [`${Number(value).toFixed(1)} kn`, 'Speed']
            }
          />
          <Line
            yAxisId="km"
            type="monotone"
            dataKey="distanceKm"
            stroke="var(--primary)"
            strokeWidth={1.75}
            dot={false}
            isAnimationActive
            animationDuration={700}
          />
          {hasSpeed && (
            <Line
              yAxisId="kn"
              type="monotone"
              dataKey="speedKn"
              stroke={VESSEL_AMBER}
              strokeWidth={1.25}
              strokeDasharray="4 2"
              dot={false}
              connectNulls
              isAnimationActive
              animationDuration={700}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-[9.5px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 bg-primary" /> Distance to origin
        </span>
        {hasSpeed && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3" style={{ background: VESSEL_AMBER }} /> Speed
          </span>
        )}
        {driftRadiusKm != null && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: 'rgba(78,154,110,0.3)' }} /> Drift
            radius
          </span>
        )}
      </div>
    </ChartFrame>
  );
}

/** Overall score per real candidate, in backend rank order — only drawn when there's something to compare. */
export function CandidateScoreChart({ vessels }: { vessels: AttributedVessel[] }) {
  const data = useMemo(
    () =>
      vessels
        .filter((v) => v.score != null)
        .map((v) => ({
          name: `#${v.rank} ${v.vesselName}`,
          score: Math.round((v.score as number) * 100),
          top: v.rank === 1,
        })),
    [vessels]
  );

  if (data.length < 2) return null;

  return (
    <ChartFrame title="Candidates compared" caption="Overall match score, backend rank order.">
      <ResponsiveContainer width="100%" height={Math.max(90, data.length * 26 + 20)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} unit="%" />
          <YAxis type="category" dataKey="name" width={110} tick={AXIS_TICK} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Score']} />
          <Bar dataKey="score" radius={[0, 3, 3, 0]} barSize={12} isAnimationActive animationDuration={600}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.top ? 'var(--primary)' : 'var(--muted-foreground)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
