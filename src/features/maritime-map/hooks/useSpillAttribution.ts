import { useEffect, useState } from 'react';
import { spillService } from '../../../services/spillService';
import { adaptSpillAttribution } from '../adapters/vesselAdapter';
import type { SpillAttribution, RawAttributionTrajectoryResponse, RawVesselsResponse } from '../types/attributionTypes';

export interface UseSpillAttributionResult {
  attribution: SpillAttribution | null;
  isLoading: boolean;
  /**
   * True while the trajectory half (`attribution_qualification` lives only
   * there) is requested but the stored result predates it. Separate from
   * `isLoading` so arming backtrack keeps showing the candidate list while it
   * refreshes, as it always has.
   */
  isTrajectoryPending: boolean;
  error: string | null;
}

interface AttributionState {
  spillId: string | null;
  attribution: SpillAttribution | null;
  error: string | null;
  /** Whether the stored result was fetched with the trajectory request (settled, success or not). */
  withTrajectory: boolean;
}

const EMPTY_STATE: AttributionState = {
  spillId: null,
  attribution: null,
  error: null,
  withTrajectory: false,
};

/**
 * Load vessel candidates and AIS attribution for a selected spill.
 * Candidate metadata from `GET /vessels` is fetched as soon as a spill is selected,
 * and AIS waypoint trajectories from `GET /attribution/trajectory` are merged when
 * backtrack mode is active (or pre-fetched).
 */
export function useSpillAttribution(
  spillId: string | null,
  backtrackActive: boolean
): UseSpillAttributionResult {
  const [state, setState] = useState<AttributionState>(EMPTY_STATE);

  useEffect(() => {
    if (!spillId) return;

    let active = true;

    // Always fetch candidate vessel information for the selected incident
    const vesselsPromise: Promise<RawVesselsResponse | null> = spillService
      .getSpillVessels(spillId)
      .catch((err) => {
        console.warn(`[useSpillAttribution] getSpillVessels failed for ${spillId}`, err);
        return null;
      });

    // If backtrack is active, fetch attribution trajectory tracks for spatial playback
    const trajectoryPromise: Promise<RawAttributionTrajectoryResponse | null> = backtrackActive
      ? spillService.getAttributionTrajectory(spillId).catch((err) => {
          console.warn(`[useSpillAttribution] getAttributionTrajectory failed for ${spillId}`, err);
          return null;
        })
      : Promise.resolve(null);

    Promise.all([trajectoryPromise, vesselsPromise])
      .then(([rawTrajectory, rawVessels]) => {
        if (!active) return;
        const attribution = adaptSpillAttribution(spillId, rawTrajectory, rawVessels);
        setState({
          spillId,
          attribution,
          error:
            attribution && attribution.vessels.length > 0
              ? null
              : 'No candidate vessels found for this detection.',
          withTrajectory: backtrackActive,
        });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        console.error(`[useSpillAttribution] failed for ${spillId}`, cause);
        setState({
          spillId,
          attribution: null,
          error: 'Could not load vessel attribution.',
          withTrajectory: backtrackActive,
        });
      });

    return () => {
      active = false;
    };
  }, [spillId, backtrackActive]);

  if (!spillId) {
    return { attribution: null, isLoading: false, isTrajectoryPending: false, error: null };
  }

  const isResolved = state.spillId === spillId;

  return {
    attribution: isResolved ? state.attribution : null,
    isLoading: !isResolved,
    isTrajectoryPending: backtrackActive && !(isResolved && state.withTrajectory),
    error: isResolved ? state.error : null,
  };
}