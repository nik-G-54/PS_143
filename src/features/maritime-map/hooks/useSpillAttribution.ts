import { useEffect, useState } from 'react';
import { getAttributionTrajectory } from '../api/attributionTrajectoryApi';
import { adaptAttributionTrajectory } from '../adapters/attributionTrajectoryAdapter';
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
 * Load authoritative vessel attribution + AIS trajectories for the selected spill.
 *
 * Data lifecycle:
 * - Automatically triggers when `spillId` changes
 * - Aborts stale in-flight requests when spill selection changes
 * - Clears attribution when `spillId` is null
 * - Never falls back to fake/mock vessel data on API error
 */
export function useSpillAttribution(
  spillId: string | null,
  enabled = true
): UseSpillAttributionResult {
  const [state, setState] = useState<AttributionState>(EMPTY_STATE);

  useEffect(() => {
    if (!spillId || !enabled) return;

    const controller = new AbortController();
    let active = true;

    getAttributionTrajectory(spillId, controller.signal)
      .then((raw) => {
        if (!active) return;
        const attribution = adaptAttributionTrajectory(raw, spillId);

        if (attribution) {
          // Structured diagnostics log (MAP-07 Section 22)
          console.log(
            `[MAP-07] Attribution trajectory loaded\n` +
              `spill: ${attribution.spillId}\n` +
              `candidates: ${attribution.vessels.length}\n` +
              attribution.vessels
                .map(
                  (v) =>
                    `  rank ${v.rank}:\n    id: ${v.vesselId}\n    mock: ${v.isMock}\n    points: ${v.trajectory.length}`
                )
                .join('\n')
          );
        }

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
          error: 'Unable to load vessel attribution data.',
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
