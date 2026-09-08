import React from 'react';

function cardinal(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

interface CompassDialProps {
  label: string;
  accent: string;
  ring: string;
  needle: string;
  directionDeg: number;
  primaryValue: string;
  secondaryValue: string;
}

/** Circular wind/current compass — readable 2D gauge (not floating 3D HTML). */
const CompassDial: React.FC<CompassDialProps> = ({
  label,
  accent,
  ring,
  needle,
  directionDeg,
  primaryValue,
  secondaryValue,
}) => {
  const rotation = directionDeg; // 0 = North, clockwise from N in meteorological "from" often; we show "to" as arrow
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-lg min-w-[148px]">
      <div className="relative w-[56px] h-[56px] shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="46" fill="rgba(2,8,20,0.85)" stroke={ring} strokeWidth="2" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
          {/* Cardinal ticks */}
          {[0, 90, 180, 270].map((d) => {
            const rad = ((d - 90) * Math.PI) / 180;
            const x1 = 50 + Math.cos(rad) * 40;
            const y1 = 50 + Math.sin(rad) * 40;
            const x2 = 50 + Math.cos(rad) * 46;
            const y2 = 50 + Math.sin(rad) * 46;
            return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="2" />;
          })}
          <text x="50" y="14" textAnchor="middle" fill={accent} fontSize="8" fontWeight="700">
            N
          </text>
          <text x="88" y="53" textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="7">
            E
          </text>
          <text x="50" y="94" textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="7">
            S
          </text>
          <text x="12" y="53" textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="7">
            W
          </text>
          {/* Needle — points in flow direction (toward) */}
          <g transform={`rotate(${rotation} 50 50)`}>
            <polygon points="50,18 55,55 50,50 45,55" fill={needle} opacity="0.95" />
            <polygon points="50,82 54,52 50,56 46,52" fill={needle} opacity="0.35" />
            <circle cx="50" cy="50" r="4" fill={needle} />
          </g>
        </svg>
      </div>
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="text-[9px] font-bold tracking-[0.16em]" style={{ color: accent }}>
          {label}
        </span>
        <span className="text-[13px] font-mono font-semibold text-slate-100 leading-tight">
          {primaryValue}
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          {secondaryValue} · {cardinal(directionDeg)}
        </span>
      </div>
    </div>
  );
};

interface EnvironmentGaugesProps {
  wind?: { speed: number; direction: number } | null;
  current?: { speed: number; direction: number } | null;
  showWind?: boolean;
  showCurrent?: boolean;
}

export const EnvironmentGauges: React.FC<EnvironmentGaugesProps> = ({
  wind,
  current,
  showWind = true,
  showCurrent = true,
}) => {
  const hasWind = showWind && wind && (wind.speed > 0 || wind.direction != null);
  const hasCurrent = showCurrent && current && (current.speed > 0 || current.direction != null);
  if (!hasWind && !hasCurrent) return null;

  return (
    <div className="flex flex-col gap-2 pointer-events-none">
      {hasWind && (
        <CompassDial
          label="WIND"
          accent="#facc15"
          ring="rgba(250,204,21,0.45)"
          needle="#fde047"
          directionDeg={wind!.direction ?? 0}
          primaryValue={`${(wind!.speed * 1.94384).toFixed(1)} kn`}
          secondaryValue={`${(wind!.direction ?? 0).toFixed(0)}°`}
        />
      )}
      {hasCurrent && (
        <CompassDial
          label="CURRENT"
          accent="#22d3ee"
          ring="rgba(34,211,238,0.45)"
          needle="#67e8f9"
          directionDeg={current!.direction ?? 0}
          primaryValue={`${current!.speed.toFixed(2)} m/s`}
          secondaryValue={`${(current!.direction ?? 0).toFixed(0)}°`}
        />
      )}
    </div>
  );
};
