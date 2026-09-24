// src/features/maritime-map/investigation/useVesselRevealStage.ts
//
// Pure stage state for the post-timeline "who did this" reveal — see
// `VesselInvestigationLayer.ts` (what renders per stage) and
// `MaritimeMap.tsx` (the effect that drives camera moves off `stage` changes
// and calls `advance()`). Kept a plain state machine with no camera/map
// access of its own, same split as `useInvestigationTimeline.ts` (pure
// progress state) vs `cameraController.ts` (the actual `flyTo` calls).

import { useCallback, useEffect, useState } from 'react';

export type VesselRevealStage = 'idle' | 'framing' | 'ship' | 'distance' | 'closeup' | 'done';

export interface UseVesselRevealStageResult {
  stage: VesselRevealStage;
  /** Begin the sequence (auto-fires once the investigation timeline finishes playing, or on Replay). */
  start: () => void;
  /** Move to a specific stage — called by MaritimeMap.tsx's choreography effect once a beat's camera move settles. */
  advance: (next: VesselRevealStage) => void;
  reset: () => void;
}

/**
 * Resets to 'idle' whenever `resetKey` changes (pass the selected spill id) —
 * selecting a different spill clears the reveal the same way it already
 * clears everything else in this feature (see `MaritimeMap.tsx`'s
 * `backtrackActive` derivation), no special-case handling needed here beyond
 * watching the same key.
 */
export function useVesselRevealStage(resetKey: string | null): UseVesselRevealStageResult {
  const [stage, setStage] = useState<VesselRevealStage>('idle');

  useEffect(() => {
    setStage('idle');
  }, [resetKey]);

  const start = useCallback(() => setStage('framing'), []);
  const advance = useCallback((next: VesselRevealStage) => setStage(next), []);
  const reset = useCallback(() => setStage('idle'), []);

  return { stage, start, advance, reset };
}
