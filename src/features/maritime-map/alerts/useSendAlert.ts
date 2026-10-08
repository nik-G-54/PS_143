import { useCallback, useReducer, useRef } from 'react';
import { appendAlertLog } from './alertLog';
import { alertSendReducer, alertStateFor, IDLE_ALERT_STATE, type AlertSendState } from './alertSendState';
import type { AlertDetails } from './alertDetails';
import { ALERT_ENV, browserSendDeps, dispatchAlert } from './sendAlert';

export interface UseSendAlertResult extends AlertSendState {
  send: (details: AlertDetails) => Promise<void>;
  reset: () => void;
}

/**
 * Send state for the selected spill. The in-flight ref is the double-send
 * guard that holds even within the same tick (two clicks before React has
 * re-rendered the disabled button); the reducer enforces the same rule for
 * state transitions.
 */
export function useSendAlert(spillId: string | null): UseSendAlertResult {
  const [state, dispatch] = useReducer(alertSendReducer, IDLE_ALERT_STATE);
  const inFlight = useRef(false);

  const send = useCallback(
    async (details: AlertDetails) => {
      // After a success the reducer would ignore `start`; skip the send too,
      // so only an explicit reset ("Send again") can fire a second alert.
      const phase = alertStateFor(state, details.spillId).phase;
      if (inFlight.current || phase === 'sending' || phase === 'sent' || !details.stationId) return;
      inFlight.current = true;
      dispatch({ type: 'start', spillId: details.spillId });
      try {
        const { entry, error } = await dispatchAlert(details, details.stationId, ALERT_ENV, browserSendDeps);
        appendAlertLog(entry);
        dispatch(
          entry.status === 'Sent'
            ? { type: 'success', spillId: details.spillId }
            : { type: 'failure', spillId: details.spillId, error: error ?? 'Unknown error' }
        );
      } finally {
        inFlight.current = false;
      }
    },
    [state]
  );

  const reset = useCallback(() => {
    if (spillId) dispatch({ type: 'reset', spillId });
  }, [spillId]);

  return { ...alertStateFor(state, spillId), send, reset };
}
