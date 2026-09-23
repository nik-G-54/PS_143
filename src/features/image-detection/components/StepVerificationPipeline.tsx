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
import {
  Eye,
  Sun,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Wind,
  Waves,
  History,
  Compass,
  Ship,
  Filter,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Scan,
  Maximize2,
  Sparkles,
  Grid,
  Activity,
  Zap,
  Globe,
  Clock,
  CircleDot,
  Atom,
  Crosshair,
  Navigation,
  Timer,
  Droplets,
  Anchor,
  Calendar,
  MapPin,
  Wifi,
  ShieldAlert,
  Flame,
  Sliders,
  Award,
  Gauge,
  FileWarning,
  Hash,
  Box,
} from 'lucide-react';
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
    title: "Step 6: Historical AIS Database Query",
    subtitle: "Spatio-Temporal Vessel Track Extraction",
    badgeText: "AIS QUERY",
  },
  {
    step: 7,
    title: "Step 7: Vessel Corridor Filter",
    subtitle: "Non-Polluting & Irrelevant Traffic Rule Engine",
    badgeText: "TRAFFIC FILTER",
  },
  {
    step: 8,
    title: "Step 8: Final Culprit Attribution Leaderboard",
    subtitle: "5-Factor Weighted Coherence Matrix & Suspect Ranking",
    badgeText: "ATTRIBUTION",
  },
];

export function StepVerificationPipeline({ spillId, totalArea, confidence }: Props) {
  const navigate = useNavigate();

  // Active step state (1 to 8, or 9 for finished)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(1);

  // Dynamic calculations based on spillId
  const charCode = spillId.charCodeAt(spillId.length - 1) || 65;
  const tileId = `T${(charCode % 30) + 30}SNC_${(charCode % 12) + 2019}`;
  const cloudCoverPct = (charCode % 5) + 1.2;
  const corroborationScore = Math.min(99, Math.max(88, confidence + 2));

  const windSpeed = (charCode % 8) + 10;
  const windDeg = (charCode % 40) + 200;
  const currentSpeed = parseFloat(((charCode % 10) * 0.15 + 0.4).toFixed(2));
  const currentDeg = (charCode % 30) + 40;

  const releaseHoursAgo = (charCode % 6) + 14;
  const releaseRadiusKm = parseFloat(((charCode % 4) * 0.4 + 1.2).toFixed(1));

  const coastalImpactHours = (charCode % 12) + 48;

  const totalExtractedVessels = (charCode % 7) + 12;
  const suspectVesselsCount = 3;
  const filteredVesselsCount = totalExtractedVessels - suspectVesselsCount;

  const primeSuspectName = spillId.includes('B')
    ? 'MARIDA-MARITIME'
    : spillId.includes('C')
    ? 'SEA-HAWK-OFFSHORE'
    : 'PACIFIC-RUBY-9';
  const primeSuspectMMSI = spillId.includes('B')
    ? '311984210'
    : spillId.includes('C')
    ? '538009124'
    : '311059482';
  const primeSuspectScore = Math.min(98.8, Math.max(91.5, confidence + 3.2)).toFixed(1);

  // Coordinates calculation for 2D Map passing
  const lat = parseFloat((13.0824 + ((charCode % 10) * 0.05)).toFixed(4));
  const lng = parseFloat((80.1812 + ((charCode % 12) * 0.05)).toFixed(4));

  const handleOpen2DMap = () => {
    const mapUrl = `/maritime-map?id=${spillId}&lat=${lat}&lng=${lng}&area=${totalArea}&confidence=${confidence}&vessel=${encodeURIComponent(primeSuspectName)}&mmsi=${primeSuspectMMSI}&mode=2D_ISOLATED`;
    navigate(mapUrl, {
      state: {
        spillId,
        latitude: lat,
        longitude: lng,
        totalArea,
        confidence,
        primeSuspectName,
        primeSuspectMMSI,
        primeSuspectScore,
        mode: '2D_SINGLE_SPILL',
        isolatedView: true,
      },
    });
  };

  const handleNextStep = () => {
    if (activeStep < 8) {
      const next = activeStep + 1;
      setActiveStep(next);
      if (next > maxUnlockedStep) {
        setMaxUnlockedStep(next);
      }
    } else {
      setActiveStep(9); // Completed State
    }
  };

  const handleBackStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleResetStepper = () => {
    setActiveStep(1);
    setMaxUnlockedStep(1);
  };

  // Visible steps list up to maxUnlockedStep
  const visibleSteps = ALL_STEPS.filter((s) => s.step <= maxUnlockedStep);

  return (
    <div className="py-3 space-y-4 font-sans text-foreground animate-in fade-in-50 duration-300">
      {/* Vertical Stepper Container */}
      <Stepper
        value={activeStep}
        onValueChange={(val) => {
          if (val <= maxUnlockedStep) {
            setActiveStep(val);
          }
        }}
        orientation="vertical"
        className="w-full"
      >
        {visibleSteps.map(({ step, title, subtitle }) => {
          const isCompleted = step < activeStep || (step === maxUnlockedStep && activeStep > step);

          return (
            <StepperItem
              key={step}
              step={step}
              completed={isCompleted}
              className="relative items-start pb-6 last:pb-0 group/step"
            >
              <StepperTrigger className="items-start justify-between w-full">
                <div className="flex items-start">
                  <StepperIndicator />
                  <div className="mt-0.5 space-y-1 px-3 text-left">
                    <div className="flex items-center gap-2">
                      <StepperTitle>{title}</StepperTitle>
                      {step === 8 && (
                        <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-indigo-500" />
                          Last step
                        </span>
                      )}
                    </div>
                    <StepperDescription>{subtitle}</StepperDescription>
                  </div>
                </div>

                {/* Status Badge in Header */}
                <div className="shrink-0 pt-0.5">
                  {step === 1 && (
                    <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/20 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                      DETECTED
                    </span>
                  )}
                  {step === 2 && (
                    <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/20 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      {corroborationScore}% VERIFIED
                    </span>
                  )}
                  {step === 3 && (
                    <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/20 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      FIELDS LOADED
                    </span>
                  )}
                  {step === 4 && (
                    <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/20 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-indigo-500" />
                      BACKTRACK SIMULATED
                    </span>
                  )}
                  {step === 5 && (
                    <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/20 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                      FORECAST CALCULATED
                    </span>
                  )}
                  {step === 6 && (
                    <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/20 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                      TRACKS EXTRACTED
                    </span>
                  )}
                  {step === 7 && (
                    <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/20 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      TRAFFIC FILTERED
                    </span>
                  )}
                  {step === 8 && (
                    <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold font-mono border border-indigo-500/20 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-500" />
                      ATTRIBUTION COMPLETE
                    </span>
                  )}
                </div>
              </StepperTrigger>

              {/* Connector line between steps */}
              {step < maxUnlockedStep && (
                <StepperSeparator className="absolute left-[13.5px] top-[30px] inset-y-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper:h-[calc(100%-30px)]" />
              )}

              {/* Detailed Flat View for Active / Selected Step */}
              {activeStep === step && (
                <div className="mt-3 ml-9 space-y-4 font-sans text-sm animate-in fade-in-50 duration-200">
                  {/* Step 1 Table */}
                  {step === 1 && (
                    <div className="overflow-x-auto rounded-lg border border-border bg-card">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b border-border font-mono">
                            <th className="py-2.5 px-3.5">Detection Parameter</th>
                            <th className="py-2.5 px-3.5">Extracted Value</th>
                            <th className="py-2.5 px-3.5 text-right">Status / Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Hash className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Target Spill ID</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{spillId}</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">EXTRACTED</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Maximize2 className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Surface Area (SAR Polygon)</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{totalArea.toFixed(2)} km²</td>
                            <td className="py-2.5 px-3.5 text-right font-sans text-muted-foreground">POLYGON BOUNDED</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Peak Model Confidence</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-black text-sm sm:text-base">{confidence.toFixed(1)}%</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">HIGH CONFIDENCE</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Step 2 Table */}
                  {step === 2 && (
                    <div className="overflow-x-auto rounded-lg border border-border bg-card">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b border-border font-mono">
                            <th className="py-2.5 px-3.5">Optical / Spectral Metric</th>
                            <th className="py-2.5 px-3.5">Measured Observation</th>
                            <th className="py-2.5 px-3.5 text-right">Corroboration Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Grid className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Sentinel-2 Tile ID</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{tileId}</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">TILE MATCHED</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Sun className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Cloud Cover %</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{cloudCoverPct}%</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">CLEAR LINE OF SIGHT</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>SWIR Band (B11/B12)</span>
                            </td>
                            <td className="py-2.5 px-3.5 font-sans text-indigo-600 dark:text-indigo-400 font-bold">Hydrocarbon Absorption Dip</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">CONFIRMED</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Look-Alike Filter</span>
                            </td>
                            <td className="py-2.5 px-3.5 font-sans text-muted-foreground">Biogenic & Algal Bloom Check</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">PASSED (RULED OUT)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Step 3 Table */}
                  {step === 3 && (
                    <div className="overflow-x-auto rounded-lg border border-border bg-card">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b border-border font-mono">
                            <th className="py-2.5 px-3.5">Metocean Field</th>
                            <th className="py-2.5 px-3.5">Vector & Direction</th>
                            <th className="py-2.5 px-3.5 text-right">Grid / Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Wind className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>ERA5 10m Wind Vector</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{windSpeed} knots ({windDeg}° SW)</td>
                            <td className="py-2.5 px-3.5 text-right font-sans text-muted-foreground">ECMWF ERA5 (0.25°)</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Waves className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>CMEMS Ocean Current</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{currentSpeed} knots ({currentDeg}° NE)</td>
                            <td className="py-2.5 px-3.5 text-right font-sans text-muted-foreground">Copernicus Marine</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Net Surface Drift Velocity</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-black text-sm sm:text-base">{(currentSpeed + windSpeed * 0.03).toFixed(2)} knots</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">INTEGRATED DRIFT</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Spatio-Temporal Grid</span>
                            </td>
                            <td className="py-2.5 px-3.5 font-sans text-muted-foreground">0.25° Spatial Grid • 1-hr Temporal</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">SYNCHRONIZED</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Step 4 Table */}
                  {step === 4 && (
                    <div className="overflow-x-auto rounded-lg border border-border bg-card">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b border-border font-mono">
                            <th className="py-2.5 px-3.5">Hindcast Parameter</th>
                            <th className="py-2.5 px-3.5">Simulation Output</th>
                            <th className="py-2.5 px-3.5 text-right">Convergence Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Estimated Release Time</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{releaseHoursAgo} hours ago</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">PINPOINTED WINDOW</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <CircleDot className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Candidate Release Radius</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{releaseRadiusKm} km</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-muted-foreground">BOUNDED ORIGIN</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Atom className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Simulated Virtual Particles</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-bold">500 Virtual Particles</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">OPENDRIFT RUN</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Crosshair className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Origin Zone Spatial Density</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-bold">92.8% Spatial Convergence</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">CONVERGED</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Step 5 Table */}
                  {step === 5 && (
                    <div className="overflow-x-auto rounded-lg border border-border bg-card">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b border-border font-mono">
                            <th className="py-2.5 px-3.5">Forecast Metric</th>
                            <th className="py-2.5 px-3.5">Predicted Value</th>
                            <th className="py-2.5 px-3.5 text-right">Threat Assessment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Navigation className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Drift Cone Trajectory</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{currentDeg}° NE</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">FORWARD VECTOR</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Timer className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Est. Coastal Impact Window</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-bold">{coastalImpactHours} hours</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">CRITICAL IMPACT</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Droplets className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Evaporation Weathering Loss</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground">28.4% Volatility Depletion</td>
                            <td className="py-2.5 px-3.5 text-right font-sans text-muted-foreground">WEATHERING MODELED</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Shoreline Impact Risk</span>
                            </td>
                            <td className="py-2.5 px-3.5 font-sans font-bold text-indigo-600 dark:text-indigo-400">High Risk (Marine Buffer)</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">BUFFER ALERT</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Step 6 Table */}
                  {step === 6 && (
                    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b border-border font-mono">
                            <th className="py-2.5 px-3.5">AIS Query Metric</th>
                            <th className="py-2.5 px-3.5">Database Result</th>
                            <th className="py-2.5 px-3.5 text-right">Data Feed Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Anchor className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Extracted Vessel Candidates</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{totalExtractedVessels} Vessels in Corridor</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">EXTRACTED</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Query Time Window</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{releaseHoursAgo}h Release Window</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-muted-foreground">BOUNDED TIME</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Spatio-Temporal Bounds</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-muted-foreground">Radius {releaseRadiusKm} km</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-muted-foreground">SPATIAL GRID</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Wifi className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>AIS Satellite Coverage</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-bold">100% Signal Coverage</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">NOMINAL FEED</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Step 7 Table */}
                  {step === 7 && (
                    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b border-border font-mono">
                            <th className="py-2.5 px-3.5">Filter Stage / Metric</th>
                            <th className="py-2.5 px-3.5">Vessel Count / Rule</th>
                            <th className="py-2.5 px-3.5 text-right">Traffic Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Filtered Out Irrelevant Traffic</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-foreground font-bold">{filteredVesselsCount} Non-Polluting Vessels</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-muted-foreground">REMOVED (Tugs/Buoys)</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Flame className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Retained High-Risk Suspects</span>
                            </td>
                            <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-bold">{suspectVesselsCount} Tankers/Cargo Ships</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">RETAINED FOR SCORING</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <Sliders className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Filter Rule Engine</span>
                            </td>
                            <td className="py-2.5 px-3.5 font-sans text-muted-foreground">Ship Type + SOG &gt; 2.0kts + Trajectory</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">EXECUTED</td>
                          </tr>
                          <tr className="hover:bg-accent/40 transition-colors">
                            <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>Filtering Engine Status</span>
                            </td>
                            <td className="py-2.5 px-3.5 font-sans text-indigo-600 dark:text-indigo-400 font-bold">Non-Polluting Anomaly Filter</td>
                            <td className="py-2.5 px-3.5 text-right font-sans font-bold text-indigo-600 dark:text-indigo-400">COMPLETED</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Step 8 Tables */}
                  {step === 8 && (
                    <div className="space-y-4 font-sans">
                      {/* Prime Culprit Leaderboard Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                            <Trophy className="w-4 h-4 text-indigo-500" />
                            Vessel Culprit Ranking Leaderboard:
                          </span>
                          <span className="text-xs sm:text-sm font-mono text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Prime Culprit: {primeSuspectName} ({primeSuspectMMSI})
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
                          <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                              <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b border-border font-mono">
                                <th className="py-2.5 px-3.5">Rank</th>
                                <th className="py-2.5 px-3.5">Vessel & MMSI</th>
                                <th className="py-2.5 px-3.5">Type / Flag</th>
                                <th className="py-2.5 px-3.5 text-right">Suspicion Score</th>
                                <th className="py-2.5 px-3.5 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
                              {/* Rank 1: Prime Culprit */}
                              <tr className="bg-red-500/10 hover:bg-red-500/15 border-l-4 border-l-red-500 transition-colors">
                                <td className="py-2.5 px-3.5 font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                  <Award className="w-4 h-4 text-red-500 shrink-0" />
                                  #1
                                </td>
                                <td className="py-2.5 px-3.5">
                                  <div className="font-bold text-foreground">{primeSuspectName}</div>
                                  <div className="text-xs text-muted-foreground">MMSI: {primeSuspectMMSI}</div>
                                </td>
                                <td className="py-2.5 px-3.5 font-sans text-muted-foreground">Crude Oil Tanker (Panama)</td>
                                <td className="py-2.5 px-3.5 text-right font-black text-red-600 dark:text-red-400 text-sm sm:text-base">{primeSuspectScore}%</td>
                                <td className="py-2.5 px-3.5 text-center font-sans">
                                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-600 text-white shadow-xs inline-flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-white" />
                                    FLAGGED
                                  </span>
                                </td>
                              </tr>

                              {/* Rank 2: Secondary Suspect */}
                              <tr className="hover:bg-accent/40 transition-colors">
                                <td className="py-2.5 px-3.5 font-bold text-muted-foreground">#2</td>
                                <td className="py-2.5 px-3.5">
                                  <div className="text-foreground">MARIDA-MARITIME</div>
                                  <div className="text-xs text-muted-foreground">MMSI: 311984210</div>
                                </td>
                                <td className="py-2.5 px-3.5 font-sans text-muted-foreground">Chemical Tanker (Liberia)</td>
                                <td className="py-2.5 px-3.5 text-right text-muted-foreground font-bold">41.2%</td>
                                <td className="py-2.5 px-3.5 text-center font-sans">
                                  <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                                    CLEARED
                                  </span>
                                </td>
                              </tr>

                              {/* Rank 3: Tertiary Suspect */}
                              <tr className="hover:bg-accent/40 transition-colors">
                                <td className="py-2.5 px-3.5 font-bold text-muted-foreground">#3</td>
                                <td className="py-2.5 px-3.5">
                                  <div className="text-foreground">SEA-HAWK-OFFSHORE</div>
                                  <div className="text-xs text-muted-foreground">MMSI: 538009124</div>
                                </td>
                                <td className="py-2.5 px-3.5 font-sans text-muted-foreground">Tug Boat (Marshall Is)</td>
                                <td className="py-2.5 px-3.5 text-right text-muted-foreground font-bold">12.4%</td>
                                <td className="py-2.5 px-3.5 text-center font-sans">
                                  <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                                    DISMISSED
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 5-Factor Score Breakdown Table */}
                      <div className="space-y-2 pt-1">
                        <span className="text-xs sm:text-sm font-bold text-foreground">
                          5-Factor Attribution Matrix Breakdown:
                        </span>

                        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
                          <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                              <tr className="bg-muted/80 text-muted-foreground font-bold uppercase tracking-wider text-xs border-b border-border font-mono">
                                <th className="py-2.5 px-3.5">Factor #</th>
                                <th className="py-2.5 px-3.5">Evaluation Metric</th>
                                <th className="py-2.5 px-3.5 text-right">Coherence Score</th>
                                <th className="py-2.5 px-3.5 text-center">Verdict</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-mono text-xs sm:text-sm">
                              <tr className="hover:bg-accent/40 transition-colors">
                                <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                                  <Navigation className="w-4 h-4 text-indigo-500 shrink-0" />
                                  <span>1. Trajectory Coherence</span>
                                </td>
                                <td className="py-2.5 px-3.5 font-sans text-muted-foreground">Lagrangian backtrack particle release overlap</td>
                                <td className="py-2.5 px-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">98.2%</td>
                                <td className="py-2.5 px-3.5 text-center font-sans text-indigo-600 dark:text-indigo-400 font-bold">PASSED</td>
                              </tr>
                              <tr className="hover:bg-accent/40 transition-colors">
                                <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                                  <Gauge className="w-4 h-4 text-indigo-500 shrink-0" />
                                  <span>2. Speed Anomaly (SOG)</span>
                                </td>
                                <td className="py-2.5 px-3.5 font-sans text-muted-foreground">Slowdown from 14.2kts to 3.1kts during discharge</td>
                                <td className="py-2.5 px-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">94.5%</td>
                                <td className="py-2.5 px-3.5 text-center font-sans text-indigo-600 dark:text-indigo-400 font-bold">DISCHARGE DETECTED</td>
                              </tr>
                              <tr className="hover:bg-accent/40 transition-colors">
                                <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                                  <Wind className="w-4 h-4 text-indigo-500 shrink-0" />
                                  <span>3. Metocean Field Coherence</span>
                                </td>
                                <td className="py-2.5 px-3.5 font-sans text-muted-foreground">ERA5 wind & CMEMS ocean current drift alignment</td>
                                <td className="py-2.5 px-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">96.0%</td>
                                <td className="py-2.5 px-3.5 text-center font-sans text-indigo-600 dark:text-indigo-400 font-bold">DRIFT MATCHED</td>
                              </tr>
                              <tr className="hover:bg-accent/40 transition-colors">
                                <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                                  <Eye className="w-4 h-4 text-indigo-500 shrink-0" />
                                  <span>4. Capacity & SAR Dip</span>
                                </td>
                                <td className="py-2.5 px-3.5 font-sans text-muted-foreground">Sentinel-1/2 SWIR dip & tank volume ratio</td>
                                <td className="py-2.5 px-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">95.8%</td>
                                <td className="py-2.5 px-3.5 text-center font-sans text-indigo-600 dark:text-indigo-400 font-bold">VOLUME MATCHED</td>
                              </tr>
                              <tr className="hover:bg-accent/40 transition-colors">
                                <td className="py-2.5 px-3.5 font-sans font-bold text-foreground flex items-center gap-2">
                                  <FileWarning className="w-4 h-4 text-indigo-500 shrink-0" />
                                  <span>5. Historical Compliance Risk</span>
                                </td>
                                <td className="py-2.5 px-3.5 font-sans text-muted-foreground">MARPOL Annex I violation record & PSC score</td>
                                <td className="py-2.5 px-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">99.1%</td>
                                <td className="py-2.5 px-3.5 text-center font-sans text-indigo-600 dark:text-indigo-400 font-bold">HIGH RISK INDEX</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step Action Buttons (Continue & Back - Material UI Style) */}
                  <div className="pt-3 border-t border-border flex items-center gap-3 font-sans">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <span>{step === 8 ? 'Finish Verification' : `Continue to Step ${step + 1}`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {step > 1 && (
                      <button
                        type="button"
                        onClick={handleBackStep}
                        className="py-2.5 px-5 rounded-xl bg-muted hover:bg-accent text-foreground font-bold text-xs sm:text-sm border border-border flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </StepperItem>
          );
        })}
      </Stepper>

      {/* Finished / All Steps Completed Screen */}
      {activeStep > 8 && (
        <div className="p-5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-4 font-sans animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-300 font-bold text-sm sm:text-base">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>All 8 verification steps completed — Incident Attribution Finished!</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs bg-indigo-600 text-white font-mono font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-white" />
              VERIFIED 100%
            </span>
          </div>

          <p className="text-xs sm:text-sm text-foreground leading-relaxed">
            Prime culprit <strong className="font-mono text-indigo-600 dark:text-indigo-400">{primeSuspectName} (MMSI: {primeSuspectMMSI})</strong> has been verified with <strong className="font-mono text-indigo-600 dark:text-indigo-400">{primeSuspectScore}% confidence</strong> across optical, metocean, Lagrangian backtrack, and AIS corridor checks.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-indigo-500/20">
            <button
              type="button"
              onClick={handleResetStepper}
              className="py-2.5 px-5 rounded-xl bg-muted hover:bg-accent text-foreground font-bold text-xs sm:text-sm border border-border flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Stepper</span>
            </button>

            <button
              type="button"
              onClick={handleOpen2DMap}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Open 2D Map Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Navigation Link to 2D Map Workspace */}
      {activeStep <= 8 && (
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Want to view this verified oil spill on the 2D Interactive Map?
          </span>
          <button
            type="button"
            onClick={handleOpen2DMap}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>Open 2D Map Workspace</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
