// src/components/map/AttributionPanel.tsx
import React, { useState } from 'react';
import type { SpillEvent, AttributionResult, EnvironmentData } from '../../types/map';
import { X, Wind, Compass, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AttributionPanelProps {
  show: boolean;
  onClose: () => void;
  spill: SpillEvent | null;
  attribution: AttributionResult | null;
  environment: EnvironmentData | null;
}

export const AttributionPanel: React.FC<AttributionPanelProps> = React.memo(({
  show,
  onClose,
  spill,
  attribution,
  environment
}) => {
  const [expandedRank, setExpandedRank] = useState<number | null>(null);

  if (!spill) return null;

  const toggleExpand = (rank: number) => {
    setExpandedRank(prev => (prev === rank ? null : rank));
  };

  return (
    <div
      className={`fixed right-0 top-16 bottom-0 w-[380px] bg-[#1A1D27] border-l border-[#252830] z-30 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
        show ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Panel Header */}
      <div className="p-5 border-b border-[#252830] flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
            Investigation Target
          </span>
          <h2 className="text-lg font-bold text-[#F1F5F9] font-mono mt-0.5">
            {spill.spill_id}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg border border-[#252830] hover:bg-[#252830] text-[#94A3B8] transition-colors"
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Panel Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Spill Overview Card */}
        <div className="p-4 bg-[#1E2130] border border-[#252830] rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#94A3B8]">Confidence</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-[#00D9A6] border border-[#00D9A6]/20">
              {(spill.detection_confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#64748B]">Dataset</span>
            <span className="text-[#F1F5F9] font-semibold">{spill.source_dataset}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#64748B]">Detected At</span>
            <span className="text-[#F1F5F9] font-mono">
              {new Date(spill.timestamp).toUTCString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#64748B]">Centroid</span>
            <span className="text-[#F1F5F9] font-mono">
              {spill.centroid.latitude.toFixed(4)}°N, {spill.centroid.longitude.toFixed(4)}°E
            </span>
          </div>
        </div>

        {/* Attribution Vessel List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
            Suspect Vessel Attribution
          </h3>

          {!attribution || attribution.ranked_vessels.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-[#252830] text-center text-xs text-[#64748B]">
              {spill.status === 'processing'
                ? 'Attribution pipeline in progress...'
                : 'No attribution data available.'}
            </div>
          ) : (
            attribution.ranked_vessels.map((vessel) => {
              const isPrimary = vessel.rank === 1;
              const isExpanded = expandedRank === vessel.rank || (isPrimary && expandedRank === null);
              const scorePct = Math.round(vessel.score * 100);

              return (
                <div
                  key={vessel.vessel_id}
                  className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                    isPrimary
                      ? 'bg-[rgba(0,217,166,0.04)] border-[#00D9A6]'
                      : 'bg-[#1E2130] border-[#252830]'
                  }`}
                >
                  {/* Card Header (Clickable for rank 2+) */}
                  <div
                    onClick={() => !isPrimary && toggleExpand(vessel.rank)}
                    className={`p-4 flex items-center justify-between select-none ${
                      !isPrimary ? 'cursor-pointer hover:bg-[#252830]/40' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isPrimary
                              ? 'bg-[#00D9A6] text-[#0F1117]'
                              : 'bg-[#252830] text-[#94A3B8]'
                          }`}
                        >
                          RANK {vessel.rank}
                        </span>
                        <span className="font-mono text-sm font-semibold text-[#F1F5F9]">
                          {vessel.vessel_id}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B]">{vessel.vessel_type}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span
                          className={`text-sm font-bold ${
                            isPrimary ? 'text-[#00D9A6]' : 'text-[#94A3B8]'
                          }`}
                        >
                          {scorePct}%
                        </span>
                        <p className="text-[10px] text-[#64748B] uppercase">Score</p>
                      </div>
                      {!isPrimary && (
                        <div className="text-[#64748B]">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#252830]/60 space-y-4">
                      {/* Score Bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 bg-[#252830] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isPrimary ? 'bg-[#00D9A6]' : 'bg-[#64748B]'
                            }`}
                            style={{ width: `${scorePct}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center bg-[#0F1117]/40 p-2.5 rounded-lg border border-[#252830]/40">
                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase block">Min Distance</span>
                          <span className="text-xs font-semibold text-[#F1F5F9] font-mono">
                            {vessel.min_distance_km.toFixed(1)} km
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase block">Time Diff</span>
                          <span className="text-xs font-semibold text-[#F1F5F9] font-mono">
                            {Math.round(vessel.time_difference_minutes)}m
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase block">Loitering</span>
                          <span className="text-xs font-semibold text-[#F1F5F9] font-mono">
                            {Math.round(vessel.loiter_minutes)}m
                          </span>
                        </div>
                      </div>

                      {/* Explanation Checklist */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                          Attribution Evidence
                        </span>
                        <ul className="space-y-1.5">
                          {vessel.explanation.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                              <span className="text-[#00D9A6] mt-0.5 shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Environmental Vectors Card */}
        {environment && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Environmental Forcing
            </h3>
            <div className="p-4 bg-[#1E2130] border border-[#252830] rounded-xl space-y-4">
              {/* Wind Vector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Wind size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#F1F5F9] block">Surface Wind</span>
                    <span className="text-[10px] text-[#64748B]">{environment.sources.wind} Reanalysis</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#F1F5F9] font-mono block">
                    {environment.wind.speed_mps.toFixed(1)} m/s
                  </span>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    {environment.wind.direction_deg.toFixed(1)}°
                  </span>
                </div>
              </div>

              {/* Current Vector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Compass size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#F1F5F9] block">Ocean Currents</span>
                    <span className="text-[10px] text-[#64748B]">{environment.sources.current}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#F1F5F9] font-mono block">
                    {environment.current.speed_mps.toFixed(2)} m/s
                  </span>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    {environment.current.direction_deg.toFixed(1)}°
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer */}
      {spill.status === 'attributed' && (
        <div className="p-4 border-t border-[#252830] bg-[#1E2130]/40">
          <Link
            to="/incident-reconstruction"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#00D9A6] hover:bg-[#00B894] text-[#0F1117] font-semibold text-xs transition-all shadow-lg shadow-emerald-950/20 hover:scale-[1.01]"
          >
            <span>View 3D Reconstruction</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      )}
    </div>
  );
});

AttributionPanel.displayName = 'AttributionPanel';
