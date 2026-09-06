import { useCallback, useState } from 'react';
import { INITIAL_INVESTIGATION_STATE } from './investigationTypes';
import type { InvestigationState } from './investigationTypes';

export interface UseInvestigationResult extends InvestigationState {
  selectSpill: (spillId: string) => void;
  clearInvestigation: () => void;
  toggleFocusMode: () => void;
}

/**
 * Owns "which spill am I investigating" for the maritime map.
 *
 * Deliberately callback-stable so the deck.gl layer factory can depend on these
 * handlers without rebuilding layers on every render.
 */
export function useInvestigation(): UseInvestigationResult {
  const [state, setState] = useState<InvestigationState>(INITIAL_INVESTIGATION_STATE);

  const selectSpill = useCallback((spillId: string) => {
    setState((previous) => ({ ...previous, selectedSpillId: spillId }));
  }, []);

  // Clearing also drops focus mode: leaving it armed would silently hide every
  // detection the next time a spill is selected.
  const clearInvestigation = useCallback(() => {
    setState(INITIAL_INVESTIGATION_STATE);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setState((previous) => ({ ...previous, focusMode: !previous.focusMode }));
  }, []);

  return { ...state, selectSpill, clearInvestigation, toggleFocusMode };
}
