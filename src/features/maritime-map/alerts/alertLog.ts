// Local record of alerts raised from this browser. Best-effort: when storage
// is blocked or full the alert itself still goes out, it just isn't remembered.

import type { AlertLogEntry } from '../types/alertTypes';

export const ALERT_LOG_KEY = 'maritime-map.alert-log.v1';
const MAX_ENTRIES = 200;

export type AlertLogStorage = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): AlertLogStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isEntry(value: unknown): value is AlertLogEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.spill_id === 'string' &&
    typeof v.station_id === 'string' &&
    typeof v.sent_at === 'string' &&
    (v.channel === 'emailjs' || v.channel === 'mailto') &&
    (v.status === 'Sent' || v.status === 'Failed')
  );
}

export function parseAlertLog(raw: string | null): AlertLogEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

/** Raw stored string, or null when absent/unreadable — used as a cheap change check. */
export function readAlertLogRaw(storage: AlertLogStorage | null = defaultStorage()): string | null {
  try {
    return storage?.getItem(ALERT_LOG_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Oldest first, as stored. */
export function readAlertLog(storage: AlertLogStorage | null = defaultStorage()): AlertLogEntry[] {
  return parseAlertLog(readAlertLogRaw(storage));
}

const listeners = new Set<() => void>();

export function subscribeAlertLog(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === ALERT_LOG_KEY || event.key === null) listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

/** Returns false when the entry could not be persisted. */
export function appendAlertLog(
  entry: AlertLogEntry,
  storage: AlertLogStorage | null = defaultStorage()
): boolean {
  try {
    if (!storage) return false;
    const next = [...readAlertLog(storage), entry].slice(-MAX_ENTRIES);
    storage.setItem(ALERT_LOG_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}

/** Spills with at least one successful alert. */
export function alertedSpillIds(log: readonly AlertLogEntry[]): Set<string> {
  return new Set(log.filter((entry) => entry.status === 'Sent').map((entry) => entry.spill_id));
}
