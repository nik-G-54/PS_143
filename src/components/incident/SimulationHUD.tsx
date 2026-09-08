import React, { useMemo } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { useSimulation } from '../../context/SimulationContext';
import { computeTrajectoryStats } from '../../utils/trajectoryStats';

function cardinal(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

export const SimulationHUD: React.FC = () => {
  const { spillDetails, backtrackData, dataSources, environment, vesselsData } = useIncident();
  const { progress, direction } = useSimulation();

  const stats = useMemo(
    () => computeTrajectoryStats(backtrackData?.backtrack.trajectory),
    [backtrackData]
  );

  if (!spillDetails) return null;

  const lat =
    backtrackData?.backtrack.observation.latitude ??
    spillDetails.centroid?.latitude ??
    spillDetails.centroid?.lat ??
    0;
  const lng =
    backtrackData?.backtrack.observation.longitude ??
    spillDetails.centroid?.longitude ??
    spillDetails.centroid?.lon ??
    0;
  const id = spillDetails.spill_id ?? 'UNKNOWN';
  const area = spillDetails.area_km2;
  const confidence = spillDetails.confidence_score;
  const vesselCount = vesselsData?.vessels?.length ?? 0;

  let simTimeStr = '---';
  if (backtrackData?.backtrack) {
    const startMs = Date.parse(backtrackData.backtrack.estimated_release_time);
    const endMs = Date.parse(backtrackData.backtrack.observation.timestamp);
    if (!isNaN(startMs) && !isNaN(endMs)) {
      const p = direction === 'BACKTRACK' ? 1 - progress : progress;
      const currentMs = startMs + (endMs - startMs) * p;
      const d = new Date(currentMs);
      simTimeStr = `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
    }
  }

  const elapsedFraction = direction === 'BACKTRACK' ? 1 - progress : progress;
  const coveredKm = stats ? stats.totalDistanceKm * elapsedFraction : null;
  const coveredHours = stats ? (stats.durationMs / 3_600_000) * elapsedFraction : null;

  const wind = environment?.wind;
  const current = environment?.current;
  const suspected =
    vesselsData?.vessels?.slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.vessel_name ??
    backtrackData?.attribution?.top_vessel ??
    null;

  return (
    <>
      <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <div className="px-3 py-1 rounded border border-cyan-400/25 bg-slate-950/65 backdrop-blur-md">
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-300/90">
            3D OCEAN VIEW — REAL-TIME SIMULATION
          </span>
        </div>
      </div>

      <div className="absolute top-14 left-4 p-3 border border-white/10 bg-slate-950/70 backdrop-blur-md rounded-lg flex flex-col gap-2 w-[210px] pointer-events-none shadow-lg z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <span className="text-[9px] text-slate-400 font-mono tracking-widest">INCIDENT</span>
          <span className="text-cyan-300 font-mono text-xs font-bold truncate max-w-[110px]">{id}</span>
        </div>

        {dataSources && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-400 font-mono">TRAJECTORY</span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                dataSources.trajectory === 'Simulated Demo'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {dataSources.trajectory.toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] gap-2">
            <span className="text-slate-400">TIME</span>
            <span className="text-cyan-200 font-mono text-right">{simTimeStr}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">LAT</span>
            <span className="text-slate-100 font-mono">
              {lat.toFixed(4)}° {lat >= 0 ? 'N' : 'S'}
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">LON</span>
            <span className="text-slate-100 font-mono">
              {lng.toFixed(4)}° {lng >= 0 ? 'E' : 'W'}
            </span>
          </div>
          {typeof area === 'number' && (
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">AREA</span>
              <span className="text-orange-300 font-mono">{area.toFixed(2)} km²</span>
            </div>
          )}
          {typeof confidence === 'number' && (
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">CONF</span>
              <span className="text-emerald-400 font-mono">
                {(confidence <= 1 ? confidence * 100 : confidence).toFixed(0)}%
              </span>
            </div>
          )}
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">VESSELS</span>
            <span className="text-cyan-300 font-mono">{vesselCount}</span>
          </div>
        </div>

        {stats && (
          <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
            <div className="text-[8px] font-bold tracking-widest text-amber-400">DRIFT COVERED</div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">DISTANCE</span>
              <span className="text-amber-200 font-mono">
                {coveredKm?.toFixed(1)} / {stats.totalDistanceKm.toFixed(1)} km
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">DURATION</span>
              <span className="text-amber-200 font-mono">
                {coveredHours?.toFixed(1)} / {(stats.durationMs / 3_600_000).toFixed(1)} h
              </span>
            </div>
          </div>
        )}

        {suspected && (
          <div className="flex justify-between text-[10px] gap-2 pt-1 border-t border-white/10">
            <span className="text-slate-400 shrink-0">SOURCE</span>
            <span className="text-red-300 font-mono text-right truncate">{suspected}</span>
          </div>
        )}

        {(wind || current) && (
          <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
            {wind && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] font-bold tracking-widest text-yellow-400">WIND</span>
                <span className="text-[10px] font-mono text-yellow-100/90">
                  {(wind.speed * 1.94384).toFixed(1)} kn · {cardinal(wind.direction ?? 0)}
                </span>
              </div>
            )}
            {current && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] font-bold tracking-widest text-cyan-400">CURRENT</span>
                <span className="text-[10px] font-mono text-cyan-100/90">
                  {current.speed.toFixed(2)} m/s · {cardinal(current.direction ?? 0)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
