// Button state machine for one spill's alert: idle → sending → sent | failed.
// Pure so the "no double-send while sending" rule is testable without a DOM.

export type AlertPhase = 'idle' | 'sending' | 'sent' | 'failed';

export interface AlertSendState {
  /** The spill this state belongs to; a different selected spill reads as idle. */
  spillId: string | null;
  phase: AlertPhase;
  error: string | null;
}

export type AlertSendAction =
  | { type: 'start'; spillId: string }
  | { type: 'success'; spillId: string }
  | { type: 'failure'; spillId: string; error: string }
  | { type: 'reset'; spillId: string };

export const IDLE_ALERT_STATE: AlertSendState = { spillId: null, phase: 'idle', error: null };

export function alertSendReducer(state: AlertSendState, action: AlertSendAction): AlertSendState {
  const current: AlertSendState =
    state.spillId === action.spillId ? state : { ...IDLE_ALERT_STATE, spillId: action.spillId };

  switch (action.type) {
    case 'start':
      // Ignored while a send is in flight (double-click) and after a success
      // (use reset to send again deliberately).
      return current.phase === 'idle' || current.phase === 'failed'
        ? { spillId: action.spillId, phase: 'sending', error: null }
        : current;
    case 'success':
      return current.phase === 'sending'
        ? { spillId: action.spillId, phase: 'sent', error: null }
        : current;
    case 'failure':
      return current.phase === 'sending'
        ? { spillId: action.spillId, phase: 'failed', error: action.error }
        : current;
    case 'reset':
      return current.phase === 'sending'
        ? current
        : { spillId: action.spillId, phase: 'idle', error: null };
  }
}

/** What the UI should read for the currently selected spill. */
export function alertStateFor(state: AlertSendState, spillId: string | null): AlertSendState {
  return spillId !== null && state.spillId === spillId ? state : { ...IDLE_ALERT_STATE, spillId };
}
