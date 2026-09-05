import { useEffect, useState } from 'react';
import { fetchSpillAttribution } from '../api/attributionApi';
import { adaptSpillAttribution } from '../adapters/vesselAdapter';
import type { SpillAttribution } from '../types/attributionTypes';

export interface UseSpillAttributionResult {
  attribution: SpillAttribution | null;
  isLoading: boolean;
  error: string | null;
}

interface AttributionState {
  spillId: string | null;
  attribution: SpillAttribution | null;
  error: string | null;
}

const EMPTY_STATE: AttributionState = { spillId: null, attribution: null, error: null };

/**
 * Load ranked vessel attribution for a spill when backtrack mode is active.
 * Pass null (or enabled=false) to skip the request.
 */
export function useSpillAttribution(
  spillId: string | null,
  enabled: boolean
): UseSpillAttributionResult {
  const [state, setState] = useState<AttributionState>(EMPTY_STATE);

  useEffect(() => {
    if (!spillId || !enabled) return;

    const controller = new AbortController();
    let active = true;

    fetchSpillAttribution(spillId, controller.signal)
      .then((raw) => {
        if (!active) return;
        const attribution = adaptSpillAttribution(spillId, raw);
        setState({
          spillId,
          attribution,
          error:
            attribution && attribution.vessels.length > 0
              ? null
              : 'No ranked vessels for this detection.',
        });
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        console.error(`[useSpillAttribution] failed for ${spillId}`, cause);
        setState({
          spillId,
          attribution: null,
          error: 'Could not load vessel attribution.',
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [spillId, enabled]);

  if (!enabled || !spillId) {
    return { attribution: null, isLoading: false, error: null };
  }

  const isResolved = state.spillId === spillId;

  return {
    attribution: isResolved ? state.attribution : null,
    isLoading: !isResolved,
    error: isResolved ? state.error : null,
  };
}
