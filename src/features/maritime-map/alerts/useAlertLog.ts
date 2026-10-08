import { useSyncExternalStore } from 'react';
import type { AlertLogEntry } from '../types/alertTypes';
import { parseAlertLog, readAlertLogRaw, subscribeAlertLog } from './alertLog';

const EMPTY: AlertLogEntry[] = [];
let cachedRaw: string | null = null;
let cachedEntries: AlertLogEntry[] = EMPTY;

/** Re-parses only when the stored string changed, so the snapshot stays referentially stable between renders. */
function getSnapshot(): AlertLogEntry[] {
  const raw = readAlertLogRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedEntries = raw ? parseAlertLog(raw) : EMPTY;
  }
  return cachedEntries;
}

/** The alert log, oldest first, kept in sync across this tab and other tabs. */
export function useAlertLog(): AlertLogEntry[] {
  return useSyncExternalStore(subscribeAlertLog, getSnapshot, () => EMPTY);
}
