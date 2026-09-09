import { useState, useEffect } from 'react';
import { getSpillById } from '../services/spillsApi';

const vesselCache = new Map<string, string | null>();
const pendingFetches = new Map<string, Promise<string | null>>();

/**
 * Hook to retrieve Rank 1 vessel IDs for an array of spill IDs,
 * with concurrent deduplication and in-memory caching.
 */
export function useTopVessels(spillIds: string[]): Record<string, string | null> {
  const [topVessels, setTopVessels] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    for (const id of spillIds) {
      if (vesselCache.has(id)) {
        initial[id] = vesselCache.get(id)!;
      }
    }
    return initial;
  });

  const idsKey = spillIds.join(',');

  useEffect(() => {
    if (spillIds.length === 0) return;

    let isMounted = true;
    const missingIds = spillIds.filter((id) => !vesselCache.has(id));

    if (missingIds.length === 0) {
      const updated: Record<string, string | null> = {};
      for (const id of spillIds) {
        updated[id] = vesselCache.get(id) ?? null;
      }
      setTopVessels(updated);
      return;
    }

    Promise.all(
      missingIds.map(async (id) => {
        if (!pendingFetches.has(id)) {
          const promise = getSpillById(id)
            .then((detail) => {
              const top = detail.ranked_top_vessel?.trim() || null;
              vesselCache.set(id, top);
              pendingFetches.delete(id);
              return top;
            })
            .catch(() => {
              vesselCache.set(id, null);
              pendingFetches.delete(id);
              return null;
            });
          pendingFetches.set(id, promise);
        }
        return pendingFetches.get(id);
      })
    ).then(() => {
      if (!isMounted) return;
      const updated: Record<string, string | null> = {};
      for (const id of spillIds) {
        updated[id] = vesselCache.get(id) ?? null;
      }
      setTopVessels(updated);
    });

    return () => {
      isMounted = false;
    };
  }, [idsKey]);

  return topVessels;
}
