import { useCallback, useEffect, useRef, useState } from 'react';
import type { Layer } from '@deck.gl/core';
import { fetchOceanFlowGrids } from '../api/oceanFlowApi';
import { createParticles, stepParticles } from '../layers/oceanFlowParticles';
import type { FlowParticle } from '../layers/oceanFlowParticles';
import { createOceanFlowLayers } from '../layers/OceanFlowLayer';
import type { OceanFlowGrids } from '../types/oceanFlowTypes';
import type { Theme } from '../../../types/ui';

const WIND_PARTICLE_COUNT = 900;
const CURRENT_PARTICLE_COUNT = 650;
const TICK_MS = 70;
/** Stylized pace, not real-time — at true wind speeds a tick's actual displacement is imperceptible at globe zoom. */
const SIMULATED_SECONDS_PER_TICK = 1400;
/** Fraction of the 0..1 fade covered per tick — ~10 ticks (~700ms) for a full cross-fade. */
const FADE_STEP = 0.1;

// windy.com-style light-blue/cyan read against a dark basemap; deeper,
// higher-contrast tones in light mode so particles don't wash out.
const WIND_COLOR: Record<Theme, [number, number, number]> = {
  dark: [125, 211, 252],
  light: [30, 64, 175],
};
const CURRENT_COLOR: Record<Theme, [number, number, number]> = {
  dark: [45, 212, 191],
  light: [12, 74, 76],
};

export type OceanFlowStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseOceanFlowResult {
  visible: boolean;
  status: OceanFlowStatus;
  error: string | null;
  layers: Layer[];
  toggle: () => void;
  retry: () => void;
}

/**
 * Click-toggled wind + ocean-current particle overlay, sourced from
 * Open-Meteo. Fetches the world grid once per mount (cached in refs, not
 * React state — the particle sim mutates every tick and would be far too
 * expensive to push through re-renders), then keeps a fixed-rate interval
 * advecting particles and fading layer opacity toward whatever `visible`
 * currently is. The interval itself is never restarted by toggling — that
 * would fight the fade — so a hide/show just changes the target it fades
 * towards; it only actually stops once the fade fully completes.
 */
export function useOceanFlow(theme: Theme): UseOceanFlowResult {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<OceanFlowStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);

  const gridsRef = useRef<OceanFlowGrids | null>(null);
  const windParticlesRef = useRef<FlowParticle[] | null>(null);
  const currentParticlesRef = useRef<FlowParticle[] | null>(null);
  const intervalRef = useRef<number | null>(null);
  const opacityRef = useRef(0);
  const visibleRef = useRef(visible);
  const themeRef = useRef(theme);
  visibleRef.current = visible;
  themeRef.current = theme;

  const stopTicking = useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTicking = useCallback(() => {
    if (intervalRef.current != null) return;
    intervalRef.current = window.setInterval(() => {
      const grids = gridsRef.current;
      const windParticles = windParticlesRef.current;
      const currentParticles = currentParticlesRef.current;
      if (!grids || !windParticles || !currentParticles) return;

      stepParticles(windParticles, grids.wind, false, SIMULATED_SECONDS_PER_TICK);
      stepParticles(currentParticles, grids.current, true, SIMULATED_SECONDS_PER_TICK);

      const target = visibleRef.current ? 1 : 0;
      const delta = target - opacityRef.current;
      opacityRef.current += Math.sign(delta) * Math.min(FADE_STEP, Math.abs(delta));

      const palette = themeRef.current === 'light' ? { wind: WIND_COLOR.light, current: CURRENT_COLOR.light } : { wind: WIND_COLOR.dark, current: CURRENT_COLOR.dark };

      setLayers(
        createOceanFlowLayers({
          windParticles,
          currentParticles,
          windColor: palette.wind,
          currentColor: palette.current,
          opacity: opacityRef.current,
        })
      );

      // Fully faded out and staying hidden — stop paying for ticks until toggled back on.
      if (opacityRef.current <= 0 && target === 0) {
        stopTicking();
      }
    }, TICK_MS);
  }, [stopTicking]);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const grids = await fetchOceanFlowGrids();
      gridsRef.current = grids;
      windParticlesRef.current = createParticles(grids.wind, WIND_PARTICLE_COUNT, false);
      currentParticlesRef.current = createParticles(grids.current, CURRENT_PARTICLE_COUNT, true);
      setStatus('ready');
      startTicking();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load wind & current data.');
    }
  }, [startTicking]);

  const toggle = useCallback(() => {
    setVisible((prev) => {
      const next = !prev;
      if (next) {
        if (gridsRef.current) {
          startTicking();
        } else {
          load();
        }
      } else {
        // Keep (or resume) ticking so the fade-out actually plays; it stops itself once opacity hits 0.
        startTicking();
      }
      return next;
    });
  }, [load, startTicking]);

  const retry = useCallback(() => {
    load();
  }, [load]);

  useEffect(() => stopTicking, [stopTicking]);

  return { visible, status, error, layers, toggle, retry };
}
