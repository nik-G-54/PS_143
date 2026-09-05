// src/hooks/useSpills.ts

import { useState, useEffect, useCallback } from 'react';
import type { NormalizedSpill, SpillEvent, SpillItemRaw } from '../types/spill';
import { getAllSpills, getSpills, normalizeSpill } from '../services/spillsApi';

export function normalizeToSpillEvent(item: SpillItemRaw): SpillEvent {
  return {
    spill_id: item.spill_id,
    detected_at: item.detected_at,
    centroid: {
      lat: item.centroid?.lat ?? 0,
      lon: item.centroid?.lon ?? 0,
    },
    area_km2: typeof item.area_km2 === 'number' && !isNaN(item.area_km2) ? item.area_km2 : 0,
    confidence_score: typeof item.confidence_score === 'number' && !isNaN(item.confidence_score) ? item.confidence_score : 0,
    candidate_count: typeof item.candidate_count === 'number' ? item.candidate_count : 0,
    image_url: item.image_url ?? '',
  };
}

export function useSpills() {
  const [spills, setSpills] = useState<NormalizedSpill[]>([]);
  const [rawSpills, setRawSpills] = useState<SpillEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const firstPage = await getSpills(1);
      if (firstPage && Array.isArray(firstPage.items)) {
        const totalPages = Math.ceil((firstPage.total || 0) / (firstPage.page_size || 20));
        let allRawItems = [...firstPage.items];

        if (totalPages > 1) {
          const remaining = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) => getSpills(i + 2))
          );
          allRawItems = [
            ...firstPage.items,
            ...remaining.flatMap((p) => (p && Array.isArray(p.items) ? p.items : []))
          ];
        }

        setSpills(allRawItems.map(normalizeSpill));
        setRawSpills(allRawItems.map(normalizeToSpillEvent));
      } else {
        const data = await getAllSpills();
        setSpills(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load spill data from API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    spills,
    rawSpills,
    isLoading,
    loading: isLoading,
    error,
    refetch: fetchAllData
  };
}
