import { useEffect, useState } from 'react';
import { fetchSpillVisualization } from '../api/trajectoryApi';
import { adaptSpillEnvironment, adaptSpillTrajectory } from '../adapters/trajectoryAdapter';
import type { SpillEnvironment, SpillTrajectory } from '../types/trajectoryTypes';

export interface UseSpillTrajectoryResult {
  trajectory: SpillTrajectory | null;
  environment: SpillEnvironment | null;
  isLoading: boolean;
  error: string | null;
}

interface TrajectoryState {
  /** The spill this result belongs to. Null before the first request resolves. */
  spillId: string | null;
  trajectory: SpillTrajectory | null;
  environment: SpillEnvironment | null;
  error: string | null;
}

const EMPTY_STATE: TrajectoryState = {
  spillId: null,
  trajectory: null,
  environment: null,
  error: null,
};

/**
 * Load the backtracked drift trajectory (and environment vectors) for the spill
 * under investigation.
 *
 * State is stored keyed by the id it was fetched for, and everything the caller
 * sees is derived from comparing that key against the requested id. That is what
 * keeps the map honest: while spill B's request is in flight the hook reports
 * loading and no trajectory, so spill A's path can never be drawn under B's dot.
 *
 * Pass null to drop the trajectory entirely.
 */
export function useSpillTrajectory(spillId: string | null): UseSpillTrajectoryResult {
  const [state, setState] = useState<TrajectoryState>(EMPTY_STATE);

  useEffect(() => {
    if (!spillId) return;

    const controller = new AbortController();
    let active = true;

    fetchSpillVisualization(spillId, controller.signal)
      .then((raw) => {
        if (!active) return;
        const trajectory = adaptSpillTrajectory(spillId, raw);
        const environment = adaptSpillEnvironment(raw);
        setState({
          spillId,
          trajectory,
          environment,
          error: trajectory ? null : 'No drift trajectory for this detection.',
        });
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        console.error(`[useSpillTrajectory] failed to load drift trajectory for ${spillId}`, cause);
        setState({
          spillId,
          trajectory: null,
          environment: null,
          error: 'Could not load the drift trajectory.',
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [spillId]);

  const isResolved = spillId != null && state.spillId === spillId;

  return {
    trajectory: isResolved ? state.trajectory : null,
    environment: isResolved ? state.environment : null,
    isLoading: spillId != null && !isResolved,
    error: isResolved ? state.error : null,
  };
}
