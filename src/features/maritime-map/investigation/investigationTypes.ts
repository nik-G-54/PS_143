/** Investigation state for the maritime map — which spill is under examination. */
export interface InvestigationState {
  /** The spill currently being investigated, or null when browsing all detections. */
  selectedSpillId: string | null;
  /**
   * When false, unselected detections stay on the map dimmed so the investigator
   * keeps spatial context. When true they are hidden entirely.
   */
  focusMode: boolean;
}

export const INITIAL_INVESTIGATION_STATE: InvestigationState = {
  selectedSpillId: null,
  focusMode: false,
};
