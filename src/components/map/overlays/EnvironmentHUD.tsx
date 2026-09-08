// src/components/map/overlays/EnvironmentHUD.tsx — FIXED VERSION
import type { WindField } from '../../../types/wind';

interface EnvironmentHUDProps {
  wind?: WindField | null;
  current?: WindField | null;
  visible?: boolean;
  viz?: any;
}

function getCompassInfo(deg: number) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const fromIdx = Math.round(deg / 22.5) % 16;
  const toDeg = (deg + 180) % 360;
  const toIdx = Math.round(toDeg / 22.5) % 16;
  return {
    from: dirs[fromIdx],
    to: dirs[toIdx],
  };
}

export function EnvironmentHUD({ wind: windProp, current: currentProp, visible = true, viz }: EnvironmentHUDProps) {
  const wind = windProp ?? viz?.environment?.wind ?? null;
  const current = currentProp ?? viz?.environment?.current ?? null;

  if (!visible || (!wind && !current)) return null;

  const windInfo = wind ? getCompassInfo(wind.direction) : null;
  const currentInfo = current ? getCompassInfo(current.direction) : null;

  return (
    <div className="absolute top-20 left-4 z-30 flex flex-col gap-2 pointer-events-none">
      {/* WIND pill */}
      {wind && windInfo && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full
          bg-gradient-to-r from-green-500/95 to-emerald-600/95
          backdrop-blur-xl border border-green-400/60
          shadow-[0_0_20px_rgba(34,197,94,0.5)]">
          <span className="text-xl">💨</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-sm leading-tight tracking-wide">
                {wind.speed.toFixed(1)} {wind.unit || 'm/s'}
              </span>
              <span className="text-green-100/90 text-xs font-mono font-semibold">
                (WIND)
              </span>
            </div>
            <span className="text-green-100/90 text-xs font-medium">
              From {windInfo.from} ({wind.direction.toFixed(0)}°) → Flowing {windInfo.to}
            </span>
          </div>
          <span className="text-green-200/70 text-[10px] ml-1 font-mono uppercase bg-green-950/40 px-1.5 py-0.5 rounded">
            ERA5
          </span>
        </div>
      )}

      {/* CURRENT pill */}
      {current && currentInfo && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full
          bg-gradient-to-r from-cyan-500/95 to-blue-600/95
          backdrop-blur-xl border border-cyan-400/60
          shadow-[0_0_20px_rgba(6,182,212,0.5)]">
          <span className="text-xl">🌊</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-sm leading-tight tracking-wide">
                {current.speed.toFixed(3)} {current.unit || 'm/s'}
              </span>
              <span className="text-cyan-100/90 text-xs font-mono font-semibold">
                (CURRENT)
              </span>
            </div>
            <span className="text-cyan-100/90 text-xs font-medium">
              From {currentInfo.from} ({current.direction.toFixed(0)}°) → Flowing {currentInfo.to}
            </span>
          </div>
          <span className="text-cyan-200/70 text-[10px] ml-1 font-mono uppercase bg-cyan-950/40 px-1.5 py-0.5 rounded">
            CMEMS
          </span>
        </div>
      )}
    </div>
  );
}
