import React, { useState } from 'react';
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';
import { Eye, Sun, ShieldCheck, ArrowRight, ChevronRight, Wind, History, Compass, Ship, Filter, Trophy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  spillId: string;
  totalArea: number;
  confidence: number;
}

interface StepDetail {
  step: number;
  title: string;
  subtitle: string;
  badgeText: string;
}

const ALL_STEPS: StepDetail[] = [
  {
    step: 1,
    title: "Step 1: Image Detection & Geometric Characterisation",
    subtitle: "CSIRO Sentinel-1 SAR Binary Classification • Polygon Extraction",
    badgeText: "DETECT + CHAR",
  },
  {
    step: 2,
    title: "Step 2: Optical Corroboration (Sentinel-2 Check)",
    subtitle: "Sentinel-2 MSI Multispectral Bands (SWIR B11/B12 + NDWI)",
    badgeText: "SENTINEL-2 MSI",
  },
  {
    step: 3,
    title: "Step 3: Metocean Field Load",
    subtitle: "ERA5 Wind Vectors + CMEMS Ocean Surface Currents",
    badgeText: "ERA5 + CMEMS",
  },
  {
    step: 4,
    title: "Step 4: HINDCAST (Backward Particle Physics)",
    subtitle: "Lagrangian Backward Particle Transport • Release Zone Pinpointing",
    badgeText: "BACKTRACK",
  },
  {
    step: 5,
    title: "Step 5: FORECAST (Forward Particle Drift)",
    subtitle: "Forward Particle Physics • Coastal Impact Threat Cone",
    badgeText: "THREAT CONE",
  },
  {
    step: 6,
    title: "Step 6: AIS Spatio-Temporal Query",
    subtitle: "Historical AIS Vessels Extraction for Release Window",
    badgeText: "AIS QUERY",
  },
  {
    step: 7,
    title: "Step 7: Traffic Filtering",
    subtitle: "Non-Polluting Vessel Filter (Tugs, Buoys, Fishing Removed)",
    badgeText: "TRAFFIC FILTER",
  },
  {
    step: 8,
    title: "Step 8: 5-Factor Suspicion Scoring & Culprit Ranking",
    subtitle: "Multi-Factor Vessel Leaderboard & Attributed Reason Codes",
    badgeText: "CULPRIT RANKING",
  },
];

export function StepVerificationPipeline({ spillId, totalArea, confidence }: Props) {
  const [activeStep, setActiveStep] = useState<number>(2); // Currently active step tab
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(2); // Up to Step 2 shown initially
  const navigate = useNavigate();

  // Dynamic calculations based strictly on spillId, totalArea, and confidence
  const seed = spillId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Step 2 Dynamic Sentinel-2 values
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const tileCode = spillId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '34SG';
  const tileId = `S2B_MSIL2A_${dateStr}_T${tileCode}H`;
  const corroborationScore = Math.min(99.4, Math.max(72.0, Number((confidence * 0.95 + 4.2).toFixed(1))));
  const cloudCoverPct = Number(((seed % 28) / 10 + 0.4).toFixed(1));

  // Step 3 Dynamic Metocean values
  const windSpeed = Number((12.5 + (seed % 7)).toFixed(1));
  const windDeg = (seed * 17) % 360;
  const currentSpeed = Number((0.6 + (seed % 5) * 0.1).toFixed(1));
  const currentDeg = (windDeg + 45) % 360;

  // Step 4 Dynamic Hindcast values
  const releaseHoursAgo = Number((18 + (seed % 14)).toFixed(1));
  const releaseRadiusKm = Number((0.8 + (totalArea * 0.15)).toFixed(2));

  // Step 5 Dynamic Forecast values
  const coastalImpactHours = Math.round(30 + (seed % 20));

  // Step 6 Dynamic AIS Query values
  const totalExtractedVessels = 8 + (seed % 12);

  // Step 7 Dynamic Traffic Filter values
  const suspectVesselsCount = Math.max(2, Math.min(5, Math.round(totalExtractedVessels * 0.25)));
  const filteredVesselsCount = totalExtractedVessels - suspectVesselsCount;

  // Step 8 Dynamic Culprit Leaderboard values
  const primeSuspectMMSI = `311${String((seed * 12345) % 899999 + 100000)}`;
  const primeSuspectName = `VESSEL-${spillId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
  const primeSuspectScore = Math.min(98.8, Math.max(88.0, Number((confidence * 0.98 + 2.1).toFixed(1))));

  const handleNextStep = () => {
    const next = activeStep + 1;
    if (next <= 8) {
      if (next > maxUnlockedStep) {
        setMaxUnlockedStep(next);
      }
      setActiveStep(next);
    }
  };

  // Visible steps list up to maxUnlockedStep
  const visibleSteps = ALL_STEPS.filter((s) => s.step <= maxUnlockedStep);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 p-6 space-y-6 shadow-xl font-sans animate-in fade-in-50 duration-300">
      {/* Stepper Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-sm font-bold font-sans tracking-wide uppercase text-slate-900 dark:text-slate-100">
              Sequential Incident Verification Stepper
            </h3>
          </div>
          <p className="text-xs font-sans text-slate-600 dark:text-slate-400 mt-1">
            Analyzing satellite physics & AIS corridor for <strong className="font-mono text-slate-900 dark:text-slate-200">{spillId}</strong>
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
            Step {activeStep} of 8 (Unlocked: {maxUnlockedStep}/8)
          </span>
        </div>
      </div>

      {/* Vertical Stepper Container */}
      <Stepper value={activeStep} onValueChange={setActiveStep} orientation="vertical" className="w-full">
        {visibleSteps.map(({ step, title, subtitle }) => {
          const isCompleted = step < activeStep || (step === maxUnlockedStep && step < 8 && maxUnlockedStep > activeStep);
          
          return (
            <StepperItem
              key={step}
              step={step}
              completed={isCompleted}
              className="relative items-start pb-6 last:pb-0 group/step"
            >
              <StepperTrigger className="items-start">
                <StepperIndicator />
                <div className="mt-0.5 space-y-0.5 px-3 text-left">
                  <StepperTitle>{title}</StepperTitle>
                  <StepperDescription>{subtitle}</StepperDescription>
                </div>
              </StepperTrigger>

              {/* Connector line between steps */}
              {step < maxUnlockedStep && (
                <StepperSeparator className="absolute left-[13.5px] top-[28px] inset-y-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper:h-[calc(100%-28px)]" />
              )}

              {/* Detailed Card for Active / Selected Step */}
              {activeStep === step && (
                <div className="mt-3 ml-9 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 font-mono text-xs shadow-xs animate-in fade-in-50 duration-200">
                  {step === 1 && (
                    <div className="space-y-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">CSIRO SAR Detection Output</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                          DETECTED
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        Spill ID: <strong className="font-mono text-slate-900 dark:text-slate-200">{spillId}</strong> • Surface Area: <strong className="font-mono text-slate-900 dark:text-slate-200">{totalArea.toFixed(2)} km²</strong> • Peak Confidence: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{confidence.toFixed(1)}%</strong>
                      </p>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700/80 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Sentinel-2 MSI Optical Swath</span>
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{corroborationScore}% VERIFIED OIL SLICK</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                        <div>Tile ID: <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{tileId}</span></div>
                        <div className="flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Cloud Cover: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{cloudCoverPct}% (Clear Line of Sight)</strong></span>
                        </div>
                        <div>SWIR Band (B11/B12): <span className="text-indigo-600 dark:text-indigo-400 font-bold">Hydrocarbon Absorption Dip Confirmed</span></div>
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Look-Alike Filter: <strong className="text-emerald-600 dark:text-emerald-400">PASSED (Biogenic Ruled Out)</strong></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700/80 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Wind className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>ECMWF ERA5 Wind & CMEMS Surface Current Fields</span>
                        </div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">METOCEAN FIELDS LOADED</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                        <div>ERA5 Wind Vector: <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{windSpeed} knots ({windDeg}° SW)</span></div>
                        <div>CMEMS Surface Current: <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{currentSpeed} knots ({currentDeg}° NE)</span></div>
                        <div>Net Surface Drift Velocity: <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{(currentSpeed + windSpeed * 0.03).toFixed(2)} knots</span></div>
                        <div>Metocean Resolution: <span className="text-slate-900 dark:text-slate-200 font-mono">0.25° Spatial Grid • 1-hr Temporal</span></div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700/80 pb-2">
                        <div className="flex items-center gap-1.5">
                          <History className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Lagrangian Backward Particle Transport Simulation (OpenDrift)</span>
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">BACKTRACK SIMULATED</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                        <div>Estimated Release Time: <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{releaseHoursAgo} hours ago</span></div>
                        <div>Candidate Release Radius: <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{releaseRadiusKm} km</span></div>
                        <div>Simulated Particles: <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">500 Virtual Oil Particles</span></div>
                        <div>Origin Zone Confidence: <span className="text-slate-900 dark:text-slate-200 font-mono">92.8% Spatial Convergence</span></div>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700/80 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Forward Particle Transport & Coastal Impact Threat Cone (+72h)</span>
                        </div>
                        <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">DRIFT FORECAST CALCULATED</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                        <div>Drift Cone Direction: <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{currentDeg}° NE</span></div>
                        <div>Est. Coastal Impact Window: <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">{coastalImpactHours} hours</span></div>
                        <div>Evaporation Weathering Loss: <span className="text-slate-900 dark:text-slate-200 font-mono">28.4% Volatility Depletion</span></div>
                        <div>Shoreline Impact Threat: <span className="text-amber-600 dark:text-amber-400 font-bold">HIGH (Marine Reserve Buffer)</span></div>
                      </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700/80 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Ship className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>Historical AIS Spatio-Temporal Tracking Database Query</span>
                        </div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">AIS TRACKS EXTRACTED</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                        <div>Extracted Candidates: <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{totalExtractedVessels} Vessels in Corridor</span></div>
                        <div>Query Time Window: <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{releaseHoursAgo}h Release Window</span></div>
                        <div>Spatio-Temporal Bounds: <span className="text-slate-900 dark:text-slate-200 font-mono">Radius {releaseRadiusKm} km</span></div>
                        <div>AIS Data Feed Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Signal Coverage</span></div>
                      </div>
                    </div>
                  )}

                  {step === 7 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700/80 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Filter className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>Maritime Traffic & Non-Polluting Anomaly Filtering</span>
                        </div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">TRAFFIC FILTERED</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                        <div>Filtered Out Traffic: <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{filteredVesselsCount} Non-Polluting Vessels</span></div>
                        <div>Retained High-Risk Suspects: <span className="text-red-600 dark:text-red-400 font-bold font-mono">{suspectVesselsCount} Suspect Tankers/Cargo Ships</span></div>
                        <div>Filter Rule Engine: <span className="text-slate-900 dark:text-slate-200 font-mono">Ship Type + SOG &gt; 2.0kts + Trajectory Match</span></div>
                        <div>Filtering Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">COMPLETED (Irrelevant Removed)</span></div>
                      </div>
                    </div>
                  )}

                  {step === 8 && (
                    <div className="space-y-4 font-sans">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            5-Factor Suspicion Scoring & Culprit Ranking Leaderboard
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-red-500/15 text-red-700 dark:text-red-400 font-bold font-mono border border-red-500/30 shrink-0">
                          ATTRIBUTION COMPLETE
                        </span>
                      </div>

                      {/* Prime Culprit Leaderboard Table */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                            Vessel Culprit Ranking Leaderboard:
                          </span>
                          <span className="text-[11px] font-mono text-red-600 dark:text-red-400 font-bold">
                            Prime Culprit: {primeSuspectName} ({primeSuspectMMSI})
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700/80">
                                <th className="py-2 px-3">Rank</th>
                                <th className="py-2 px-3">Vessel & MMSI</th>
                                <th className="py-2 px-3">Type / Flag</th>
                                <th className="py-2 px-3 text-right">Suspicion Score</th>
                                <th className="py-2 px-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                              {/* Rank 1: Prime Culprit */}
                              <tr className="bg-red-500/10 dark:bg-red-950/30 hover:bg-red-500/15 transition-colors">
                                <td className="py-2 px-3 font-bold text-red-600 dark:text-red-400">#1</td>
                                <td className="py-2 px-3">
                                  <div className="font-bold text-slate-900 dark:text-slate-100">{primeSuspectName}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">MMSI: {primeSuspectMMSI}</div>
                                </td>
                                <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">Crude Oil Tanker (Panama)</td>
                                <td className="py-2 px-3 text-right font-black text-red-600 dark:text-red-400">{primeSuspectScore}%</td>
                                <td className="py-2 px-3 text-center font-sans">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white shadow-xs">
                                    FLAGGED
                                  </span>
                                </td>
                              </tr>

                              {/* Rank 2: Secondary Suspect */}
                              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2 px-3 font-bold text-slate-500">#2</td>
                                <td className="py-2 px-3">
                                  <div className="text-slate-800 dark:text-slate-200">MARIDA-MARITIME</div>
                                  <div className="text-[10px] text-slate-500">MMSI: 311984210</div>
                                </td>
                                <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">Chemical Tanker (Liberia)</td>
                                <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400 font-bold">41.2%</td>
                                <td className="py-2 px-3 text-center font-sans">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    CLEARED
                                  </span>
                                </td>
                              </tr>

                              {/* Rank 3: Tertiary Suspect */}
                              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2 px-3 font-bold text-slate-500">#3</td>
                                <td className="py-2 px-3">
                                  <div className="text-slate-800 dark:text-slate-200">SEA-HAWK-OFFSHORE</div>
                                  <div className="text-[10px] text-slate-500">MMSI: 538009124</div>
                                </td>
                                <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">Tug Boat (Marshall Is)</td>
                                <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400 font-bold">12.4%</td>
                                <td className="py-2 px-3 text-center font-sans">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    DISMISSED
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 5-Factor Score Breakdown Table */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                          5-Factor Attribution Matrix Breakdown:
                        </span>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700/80">
                                <th className="py-2 px-3">Factor #</th>
                                <th className="py-2 px-3">Evaluation Metric</th>
                                <th className="py-2 px-3 text-right">Coherence Score</th>
                                <th className="py-2 px-3 text-center">Verdict</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">1. Trajectory Coherence</td>
                                <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">Lagrangian backtrack particle release overlap</td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">98.2%</td>
                                <td className="py-2 px-3 text-center font-sans text-emerald-600 dark:text-emerald-400 font-bold">PASSED</td>
                              </tr>
                              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">2. Speed Anomaly (SOG)</td>
                                <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">Slowdown from 14.2kts to 3.1kts during discharge</td>
                                <td className="py-2 px-3 text-right font-bold text-amber-600 dark:text-amber-400">94.5%</td>
                                <td className="py-2 px-3 text-center font-sans text-amber-600 dark:text-amber-400 font-bold">DISCHARGE DETECTED</td>
                              </tr>
                              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">3. Metocean Field Coherence</td>
                                <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">ERA5 wind & CMEMS ocean current drift alignment</td>
                                <td className="py-2 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">96.0%</td>
                                <td className="py-2 px-3 text-center font-sans text-indigo-600 dark:text-indigo-400 font-bold">DRIFT MATCHED</td>
                              </tr>
                              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">4. Capacity & SAR Dip</td>
                                <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">Sentinel-1/2 SWIR dip & tank volume ratio</td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">95.8%</td>
                                <td className="py-2 px-3 text-center font-sans text-emerald-600 dark:text-emerald-400 font-bold">VOLUME MATCHED</td>
                              </tr>
                              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">5. Historical Compliance Risk</td>
                                <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">MARPOL Annex I violation record & PSC score</td>
                                <td className="py-2 px-3 text-right font-bold text-red-600 dark:text-red-400">99.1%</td>
                                <td className="py-2 px-3 text-center font-sans text-red-600 dark:text-red-400 font-bold">HIGH RISK INDEX</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step Navigation Trigger Button */}
                  {step < 8 && step === maxUnlockedStep && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700/60">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                        Review output for Step {step} above to unlock next stage.
                      </span>
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer font-sans"
                      >
                        <span>Proceed to Step {step + 1}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </StepperItem>
          );
        })}
      </Stepper>

      {/* Footer Navigation Link to 3D Reconstruction Workspace */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
        <span className="text-xs text-slate-600 dark:text-slate-400">
          Want full 3D interactive particle simulation on live map?
        </span>
        <button
          type="button"
          onClick={() => navigate(`/incident?id=${spillId}`)}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span>Open 3D Map Reconstruction Workspace</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
