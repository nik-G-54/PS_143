// src/components/map/overlays/SlideInPanel.tsx
import React from 'react';
import { X, Ship, Navigation, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SpillDetail, VesselCandidate, VisualizationData } from '../../../types/detail';

interface Props {
  spill: SpillDetail | null;
  vessels: VesselCandidate[];
  viz: VisualizationData | null;
  loading: boolean;
  onClose: () => void;
}

export function SlideInPanel({ spill, vessels, viz, loading, onClose }: Props) {
  if (!spill) return null;

  const wind = viz?.environment?.wind;
  const current = viz?.environment?.current;

  return (
    <div className="absolute right-0 top-0 h-full w-[400px] z-20 
      bg-slate-950/80 backdrop-blur-xl border-l border-slate-700/50
      overflow-y-auto animate-slide-in">
      
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">{spill.spill_id}</h2>
            <p className="text-slate-400 text-sm">{(spill.source_type || 'UNKNOWN').toUpperCase()} Source</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
          <p className="mt-3 text-sm">Loading spill data…</p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Detection Confidence Bar */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Detection Confidence</span>
              <span className="text-white font-bold text-lg">
                {(spill.confidence_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${spill.confidence_score * 100}%`,
                  background: `linear-gradient(90deg, #ef4444, ${
                    spill.confidence_score > 0.7 ? '#f97316' : '#eab308'
                  })`,
                }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<MapPin className="w-4 h-4" />} label="Area" value={`${spill.area_km2} km²`} />
            <StatCard icon={<Clock className="w-4 h-4" />} label="Age" value={`${spill.estimated_age_hours || 0}h`} />
            <StatCard icon={<Navigation className="w-4 h-4" />} label="Lat" value={(spill.observation_latitude || spill.centroid?.lat || 0).toFixed(4)} />
            <StatCard icon={<Navigation className="w-4 h-4" />} label="Lon" value={(spill.observation_longitude || spill.centroid?.lon || 0).toFixed(4)} />
          </div>

          {/* Image */}
          {spill.image_url && (
            <div className="rounded-xl overflow-hidden border border-slate-800">
              <img src={spill.image_url} alt="Satellite" className="w-full h-40 object-cover" />
            </div>
          )}

          {/* Environment */}
          {wind && current && (
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
              <h3 className="text-white font-semibold text-sm mb-3">Environment at Detection</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-green-400 text-xs mb-1">💨 Wind</p>
                  <p className="text-white font-mono">{wind.speed.toFixed(1)} m/s</p>
                  <p className="text-slate-500 text-xs">{wind.direction.toFixed(0)}°</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-cyan-400 text-xs mb-1">🌊 Current</p>
                  <p className="text-white font-mono">{current.speed.toFixed(3)} m/s</p>
                  <p className="text-slate-500 text-xs">{current.direction.toFixed(0)}°</p>
                </div>
              </div>
            </div>
          )}

          {/* Suspect Vessels */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Ship className="w-4 h-4 text-orange-400" />
              Suspect Vessels ({vessels.length})
            </h3>
            <div className="space-y-2">
              {vessels.slice(0, 5).map(v => (
                <div key={v.vessel_id} className={`flex items-center gap-3 p-2 rounded-lg ${
                  v.rank === 1 ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-800/40'
                }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    v.rank === 1 ? 'bg-orange-500 text-white' :
                    v.rank === 2 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {v.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {v.vessel_name || v.vessel_id}
                    </p>
                    {v.distance_to_origin_km && (
                      <p className="text-slate-500 text-xs">{v.distance_to_origin_km} km from origin</p>
                    )}
                  </div>
                  {v.is_mock ? (
                    <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">SIM</span>
                  ) : (
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded font-bold">PRIMARY</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link
            to="/incident-reconstruction"
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 
              hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl 
              flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            Incident Reconstruction
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-800/40 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
        {icon} {label}
      </div>
      <p className="text-white font-mono text-sm">{value}</p>
    </div>
  );
}
