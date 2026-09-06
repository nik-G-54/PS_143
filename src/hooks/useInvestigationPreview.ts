// src/hooks/useInvestigationPreview.ts

import { useState, useEffect, useRef } from 'react';
import { FullVisualizationData } from '../types/spill';
import { getSpillVisualization } from '../services/spillsApi';

const cache = new Map<string, FullVisualizationData>();

export function useInvestigationPreview(spillId: string | null) {
  const [data, setData] = useState<FullVisualizationData | null>(spillId ? cache.get(spillId) || null : null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(spillId && !cache.has(spillId)));
  const [error, setError] = useState<string | null>(null);

  const activeIdRef = useRef<string | null>(spillId);
  activeIdRef.current = spillId;

  useEffect(() => {
    if (!spillId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (cache.has(spillId)) {
      setData(cache.get(spillId)!);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getSpillVisualization(spillId, controller.signal)
      .then((res) => {
        if (activeIdRef.current === spillId) {
          cache.set(spillId, res);
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (activeIdRef.current === spillId) {
          setError(err?.message || 'Unable to load investigation preview.');
        }
      })
      .finally(() => {
        if (activeIdRef.current === spillId) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [spillId]);

  return { data, isLoading, error };
}
