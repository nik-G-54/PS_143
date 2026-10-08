// Persisted on/off preferences for map layers, same approach as the top bar's
// compact-mode flag: localStorage, every access in try/catch, and the page must
// work (on its default) when storage is blocked.

export type PrefStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const NEAREST_COAST_GUARD_PREF = 'maritime-map.layers.nearest-coast-guard';

function defaultStorage(): PrefStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Stored "true"/"false" wins; anything else (absent, corrupt, blocked) yields `fallback`. */
export function readBooleanPref(
  key: string,
  fallback: boolean,
  storage: PrefStorage | null = defaultStorage()
): boolean {
  try {
    const raw = storage?.getItem(key);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  } catch {
    // Storage blocked — fall through to the default.
  }
  return fallback;
}

export function writeBooleanPref(
  key: string,
  value: boolean,
  storage: PrefStorage | null = defaultStorage()
): void {
  try {
    storage?.setItem(key, String(value));
  } catch {
    // Storage blocked or full — the choice just isn't remembered.
  }
}
