import { useEffect, useState } from 'react';
import { fetchSpillForecast } from '../api/forecastApi';
import { adaptSpillForecast } from '../adapters/forecastAdapter';
import type { SpillForecast } from '../types/forecastTypes';

export interface UseSpillForecastResult {
  forecast: SpillForecast | null;
  isLoading: boolean;
  error: string | null;
}

interface ForecastState {
  /** The spill this result belongs to. Null before the first request resolves. */
  spillId: string | null;
  forecast: SpillForecast | null;
  error: string | null;
}

const EMPTY_STATE: ForecastState = {
  spillId: null,
  forecast: null,
  error: null,
};

/**
 * Load the forward drift forecast for the spill under investigation.
 *
 * State is stored keyed by the id it was fetched for, and everything the caller
 * sees is derived from comparing that key against the requested id. That is what
 * keeps the map honest: while spill B's request is in flight the hook reports
 * loading and no forecast, so spill A's predicted path can never be drawn under
 * B's dot.
 *
 * Pass null to drop the forecast entirely.
 */
export function useSpillForecast(spillId: string | null): UseSpillForecastResult {
  const [state, setState] = useState<ForecastState>(EMPTY_STATE);

  useEffect(() => {
    if (!spillId) return;

    const controller = new AbortController();
    let active = true;

    fetchSpillForecast(spillId, controller.signal)
      .then((raw) => {
        if (!active) return;
        const forecast = adaptSpillForecast(spillId, raw);
        setState({
          spillId,
          forecast,
          error: forecast ? null : 'No drift forecast for this detection.',
        });
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        console.error(`[useSpillForecast] failed to load drift forecast for ${spillId}`, cause);
        setState({
          spillId,
          forecast: null,
          error: 'Could not load the drift forecast.',
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [spillId]);

  const isResolved = spillId != null && state.spillId === spillId;

  return {
    forecast: isResolved ? state.forecast : null,
    isLoading: spillId != null && !isResolved,
    error: isResolved ? state.error : null,
  };
}
