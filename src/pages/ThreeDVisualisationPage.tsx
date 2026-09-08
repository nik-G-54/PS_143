import React, { useEffect } from 'react';
import { Activity, Droplets, Gauge, Layers3, Radio, Waves, Wind, X } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { SimulationViewport } from '../components/incident/SimulationViewport';
import { IncidentProvider, useIncident } from '../context/IncidentContext';
import { SimulationProvider } from '../context/SimulationContext';
import { SceneLayersProvider } from '../context/SceneLayersContext';
import { OceanControlsProvider } from '../context/OceanControlsContext';
import { ViewportCameraProvider } from '../context/ViewportCameraContext';
import { InteractionProvider } from '../context/InteractionContext';
import { useViewportCamera } from '../context/ViewportCameraContext';

const Metric: React.FC<{ label: string; value: string; icon: React.ReactNode; accent?: string }> = ({ label, value, icon, accent = 'text-primary' }) => (
  <div className="border-b border-cyan-950/70 pb-3 last:border-b-0">
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
      <span className={accent}>{icon}</span>{label}
    </div>
    <div className="mt-1 text-base font-semibold tracking-wide text-slate-100">{value}</div>
  </div>
);

const GlassPanel: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <section className={`rounded border border-cyan-900/70 bg-[#061522]/90 p-4 shadow-[0_0_24px_rgba(0,157,218,0.08)] backdrop-blur-md ${className}`}>
    <div className="mb-3 flex items-center justify-between border-b border-cyan-950/80 pb-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">{title}</h2>
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
    </div>
    {children}
  </section>
);

const VisualizationWorkspace: React.FC = () => {
  const { spillDetails, backtrackData, vesselsData } = useIncident();
  const { api: cameraApi } = useViewportCamera();

  useEffect(() => {
    if (!cameraApi) return;
    cameraApi.zoomIn();
    cameraApi.zoomIn();
  }, [cameraApi]);
  const source = backtrackData?.backtrack?.source_estimate;
  const confidence = spillDetails?.confidence_score ?? 0;
  const confidencePercent = confidence <= 1 ? confidence * 100 : confidence;
  const vesselCount = vesselsData?.vessels?.length ?? 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020912] text-slate-100 font-sans">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0">
            <SimulationViewport />
          </div>

          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 md:p-4 lg:p-5">
            <div className="flex items-start justify-between gap-3">
              <GlassPanel title="Incident overview" className="pointer-events-auto w-64 lg:w-72">
                <div className="space-y-3">
                  <Metric label="Detected" value={spillDetails?.detected_at ? new Date(spillDetails.detected_at).toLocaleString() : '17 May 2025 08:42 UTC'} icon={<Activity size={12} />} />
                  <Metric label="Source estimate" value={source ? `${source.latitude.toFixed(3)}°, ${source.longitude.toFixed(3)}°` : 'Calculating'} icon={<Radio size={12} />} />
                  <Metric label="Spill area" value={`${spillDetails?.area_km2?.toFixed(2) ?? '2.48'} km²`} icon={<Droplets size={12} />} accent="text-orange-400" />
                  <Metric label="Confidence" value={`${confidencePercent.toFixed(0)}%`} icon={<Gauge size={12} />} />
                </div>
              </GlassPanel>

              <GlassPanel title="System status" className="pointer-events-auto hidden w-64 md:block">
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between"><span>Ocean model</span><span className="text-emerald-400">HYCOM</span></div>
                  <div className="flex items-center justify-between"><span>Wind model</span><span className="text-emerald-400">ECMWF</span></div>
                  <div className="flex items-center justify-between"><span>AIS candidates</span><span className="text-cyan-300">{vesselCount || '—'}</span></div>
                  <div className="flex items-center justify-between"><span>Stream</span><span className="flex items-center gap-1.5 text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />LIVE</span></div>
                </div>
              </GlassPanel>
            </div>

            <div className="flex items-end justify-between gap-3">
              <GlassPanel title="Environmental telemetry" className="pointer-events-auto w-64 lg:w-72">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded border border-cyan-950 bg-slate-950/50 p-2"><Wind size={14} className="mb-2 text-cyan-300" /><div className="text-[9px] uppercase text-slate-500">Wind</div><div className="mt-1 text-xs">18.6 kn</div><div className="text-[10px] text-slate-400">NE</div></div>
                  <div className="rounded border border-cyan-950 bg-slate-950/50 p-2"><Waves size={14} className="mb-2 text-cyan-300" /><div className="text-[9px] uppercase text-slate-500">Current</div><div className="mt-1 text-xs">0.87 m/s</div><div className="text-[10px] text-slate-400">NE</div></div>
                  <div className="rounded border border-cyan-950 bg-slate-950/50 p-2"><Layers3 size={14} className="mb-2 text-cyan-300" /><div className="text-[9px] uppercase text-slate-500">Depth</div><div className="mt-1 text-xs">-124 m</div><div className="text-[10px] text-slate-400">seabed</div></div>
                </div>
              </GlassPanel>

              <GlassPanel title="Visualization layers" className="pointer-events-auto hidden w-56 lg:block">
                <div className="space-y-2 text-sm text-slate-300">
                  {['Water surface', 'Oil layer', 'Vessel tracks', 'Source estimate'].map((label, index) => <label key={label} className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-cyan-400" /> <span className={index === 1 ? 'text-orange-300' : ''}>{label}</span></label>)}
                </div>
              </GlassPanel>
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded border border-cyan-800/80 bg-[#061522]/90 px-4 py-2 text-center shadow-[0_0_18px_rgba(34,211,238,0.12)] backdrop-blur-md">
            <div className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200"><Droplets size={12} className="text-orange-400" />3D ocean view</div>
            <div className="mt-1 text-[9px] uppercase tracking-widest text-slate-500">Real-time incident simulation</div>
          </div>

          <button type="button" className="absolute right-4 top-4 z-30 rounded border border-cyan-900 bg-slate-950/70 p-2 text-slate-400 hover:text-white" aria-label="Close visualization overlay"><X size={14} /></button>
        </main>
      </div>
    </div>
  );
};

export const ThreeDVisualisationPage: React.FC = () => (
  <InteractionProvider>
    <IncidentProvider>
      <SimulationProvider>
        <SceneLayersProvider>
          <OceanControlsProvider>
            <ViewportCameraProvider>
              <VisualizationWorkspace />
            </ViewportCameraProvider>
          </OceanControlsProvider>
        </SceneLayersProvider>
      </SimulationProvider>
    </IncidentProvider>
  </InteractionProvider>
);

export default ThreeDVisualisationPage;
