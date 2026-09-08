import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { OceanConfig } from '../systems/ocean';
import { DEFAULT_OCEAN_CONFIG, cloneOceanConfig } from '../systems/ocean';

/** Color options for dropdown menus (replaces lil-gui color pickers). */
export interface OceanColorOption {
  id: string;
  label: string;
  hex: string;
}

export const DEPTH_COLOR_OPTIONS: OceanColorOption[] = [
  { id: 'ref-teal', label: 'Ocean Teal', hex: '#186691' },
  { id: 'deep-navy', label: 'Deep Navy', hex: '#001a33' },
  { id: 'midnight', label: 'Midnight', hex: '#050f1e' },
  { id: 'storm', label: 'Storm Grey', hex: '#0a1a20' },
  { id: 'tropical', label: 'Tropical Deep', hex: '#063049' },
  { id: 'abyss', label: 'Abyss', hex: '#010c1c' },
];

export const SURFACE_COLOR_OPTIONS: OceanColorOption[] = [
  { id: 'sky', label: 'Sky Blue', hex: '#9bd8ff' },
  { id: 'lagoon', label: 'Lagoon', hex: '#5fc6c2' },
  { id: 'coastal', label: 'Coastal', hex: '#0a6b7a' },
  { id: 'dawn', label: 'Dawn Cyan', hex: '#63c7c0' },
  { id: 'dusk', label: 'Dusk Teal', hex: '#33707a' },
  { id: 'steel', label: 'Steel', hex: '#295a72' },
];

export const FOAM_COLOR_OPTIONS: OceanColorOption[] = [
  { id: 'white', label: 'White', hex: '#ffffff' },
  { id: 'soft', label: 'Soft Foam', hex: '#f2f8fc' },
  { id: 'warm', label: 'Warm Foam', hex: '#fff1df' },
  { id: 'cool', label: 'Cool Mist', hex: '#dbe8f2' },
  { id: 'bright', label: 'Bright Cap', hex: '#f6fdff' },
];

/** Named palettes — one dropdown sets depth + surface + foam together. */
export interface OceanPalette {
  id: string;
  label: string;
  depth: string;
  surface: string;
  foam: string;
}

export const OCEAN_PALETTES: OceanPalette[] = [
  { id: 'reference', label: 'Reference Demo', depth: '#186691', surface: '#9bd8ff', foam: '#ffffff' },
  { id: 'sentinel', label: 'Ocean Sentinel', depth: '#001a33', surface: '#0a6b7a', foam: '#f2f8fc' },
  { id: 'tropical', label: 'Tropical Noon', depth: '#063049', surface: '#5fc6c2', foam: '#f6fdff' },
  { id: 'golden', label: 'Golden Hour', depth: '#08283b', surface: '#3f9f9a', foam: '#fff1df' },
  { id: 'storm', label: 'Stormy Seas', depth: '#0a1a20', surface: '#38666a', foam: '#eef3f5' },
  { id: 'blue-hour', label: 'Blue Hour', depth: '#050f1e', surface: '#295a72', foam: '#dbe8f2' },
];

/**
 * Control values mirrored from Threejs-water-shader lil-gui,
 * mapped onto our WaterThreeJS / Gerstner ocean system.
 */
export interface OceanControlValues {
  /** Big wave elevation (reference: uBig) */
  uBig: number;
  uFrequencyX: number;
  uFrequencyY: number;
  uSpeed: number;
  depthColor: string;
  surfaceColor: string;
  uColorOffset: number;
  uColorMultiplier: number;
  uSmallWavesElevation: number;
  uSmallWavesFrequency: number;
  uSmallWavesSpeed: number;
  uSmallIterations: number;
  foamColor: string;
  uFoamThreshold: number;
  uFoamStrength: number;
  paletteId: string;
}

export const DEFAULT_OCEAN_CONTROLS: OceanControlValues = {
  uBig: 0.2,
  uFrequencyX: 4,
  uFrequencyY: 1.5,
  uSpeed: 0.75,
  depthColor: '#186691',
  surfaceColor: '#9bd8ff',
  uColorOffset: 0.08,
  uColorMultiplier: 5,
  uSmallWavesElevation: 0.15,
  uSmallWavesFrequency: 3,
  uSmallWavesSpeed: 0.2,
  uSmallIterations: 4,
  foamColor: '#ffffff',
  uFoamThreshold: 0.75,
  uFoamStrength: 0.35,
  paletteId: 'reference',
};

/**
 * Convert reference-style controls into OceanConfig overrides
 * used by OceanSurface / CPU Gerstner sampling.
 */
export function controlsToOceanOverrides(c: OceanControlValues): Partial<OceanConfig> {
  // Frequency X → swell wavelength (higher freq = shorter swell)
  const wavelength = Math.max(40, Math.min(320, 280 / Math.max(0.35, c.uFrequencyX / 2.5)));
  const waveFrequency = (2 * Math.PI) / wavelength;
  // Frequency Y → directional spread of the Gerstner spectrum
  const dirSpread = Math.max(0, Math.min(1.6, (c.uFrequencyY / 10) * 1.6));
  // Big elevation → amplitude (reference max 1 ≈ calm; scale for scene units)
  const waveAmplitude = 0.15 + c.uBig * 1.85;
  const waveSteepness = 0.35 + c.uBig * 0.55;
  const waveSpeed = Math.max(0, Math.min(3, c.uSpeed));
  const detailStrength = Math.max(0, Math.min(1.2, c.uSmallWavesElevation * 2.2));
  const detailScale = Math.max(0.05, Math.min(1.2, c.uSmallWavesFrequency / 18));
  const waveCount = Math.max(4, Math.min(40, Math.round(8 + c.uSmallIterations * 4)));
  const foamThreshold = Math.max(0, Math.min(1, c.uFoamThreshold));
  const foamOpacity = Math.max(0.15, Math.min(1, c.uFoamStrength + 0.45));
  const foamCoverage = 0.45 + c.uFoamStrength * 1.4;
  const crestFoamStart = Math.max(0.3, 1.1 - c.uFoamStrength);
  // Color offset/multiplier nudge shallow mix via SSS strength
  const sssStrength = Math.max(0.05, Math.min(1.2, c.uColorOffset * 2 + c.uColorMultiplier * 0.04));

  return {
    waveAmplitude,
    waveFrequency,
    baseWavelength: wavelength,
    waveSteepness,
    waveSpeed,
    dirSpread,
    detailStrength,
    detailScale,
    waveCount,
    foamThreshold,
    foamOpacity,
    foamCoverage,
    crestFoamStart,
    sssStrength,
    deepColor: c.depthColor,
    shallowColor: c.surfaceColor,
    foamColor: c.foamColor,
  };
}

export function applyOceanControlOverrides(
  base: OceanConfig,
  controls: OceanControlValues,
  enabled: boolean
): OceanConfig {
  if (!enabled) return base;
  const next = cloneOceanConfig(base);
  Object.assign(next, controlsToOceanOverrides(controls));
  return next;
}

interface OceanControlsContextValue {
  controls: OceanControlValues;
  panelOpen: boolean;
  enabled: boolean;
  setPanelOpen: (open: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setControl: <K extends keyof OceanControlValues>(key: K, value: OceanControlValues[K]) => void;
  setControls: (patch: Partial<OceanControlValues>) => void;
  applyPalette: (paletteId: string) => void;
  resetControls: () => void;
}

const OceanControlsContext = createContext<OceanControlsContextValue | undefined>(undefined);

export const OceanControlsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [controls, setControlsState] = useState<OceanControlValues>(DEFAULT_OCEAN_CONTROLS);
  const [panelOpen, setPanelOpen] = useState(true);
  const [enabled, setEnabled] = useState(true);

  const setControl = useCallback(
    <K extends keyof OceanControlValues>(key: K, value: OceanControlValues[K]) => {
      setControlsState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setControls = useCallback((patch: Partial<OceanControlValues>) => {
    setControlsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyPalette = useCallback((paletteId: string) => {
    const palette = OCEAN_PALETTES.find((p) => p.id === paletteId);
    if (!palette) return;
    setControlsState((prev) => ({
      ...prev,
      paletteId,
      depthColor: palette.depth,
      surfaceColor: palette.surface,
      foamColor: palette.foam,
    }));
  }, []);

  const resetControls = useCallback(() => {
    setControlsState(DEFAULT_OCEAN_CONTROLS);
  }, []);

  const value = useMemo(
    () => ({
      controls,
      panelOpen,
      enabled,
      setPanelOpen,
      setEnabled,
      setControl,
      setControls,
      applyPalette,
      resetControls,
    }),
    [controls, panelOpen, enabled, setControl, setControls, applyPalette, resetControls]
  );

  return <OceanControlsContext.Provider value={value}>{children}</OceanControlsContext.Provider>;
};

export function useOceanControls() {
  const ctx = useContext(OceanControlsContext);
  if (!ctx) throw new Error('useOceanControls must be used within OceanControlsProvider');
  return ctx;
}

/** Safe optional hook for components that may render outside the provider. */
export function useOceanControlsOptional() {
  return useContext(OceanControlsContext);
}

export { DEFAULT_OCEAN_CONFIG };
