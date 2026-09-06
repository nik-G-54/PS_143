import { useCallback, useEffect, useState } from 'react';
import { fetchAllSpills } from '../api/spillsApi';
import { adaptSpillList } from '../adapters/spillAdapter';
import type { MapSpill } from '../types/spillTypes';

export interface UseSpillsResult {
  spills: MapSpill[];
  isLoading: boolean;
  error: string | null;
  /** Re-run the fetch, e.g. from a retry button. */
  reload: () => void;
}

/**
 * Load every detected oil spill once and keep it in component state.
 *
 * The dataset is a static historical archive, so there is nothing to poll and no
 * cache to invalidate — one fetch per mount, aborted if the map unmounts first.
 */
export function useSpills(): UseSpillsResult {
  const [spills, setSpills] = useState<MapSpill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    // Reset the request state from the event that triggered it rather than from
    // inside the effect: on first mount these are already the initial values, so
    // writing them there would be a redundant render pass every time.
    setIsLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchAllSpills(controller.signal)
      .then((rawItems) => {
        if (!active) return;
        setSpills(adaptSpillList(rawItems));
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        console.error('[useSpills] failed to load detected spills', cause);
        setSpills([]);
        setError('Could not load detected spills.');
        setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadToken]);

  return { spills, isLoading, error, reload };
}
