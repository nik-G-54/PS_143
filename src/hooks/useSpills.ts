// src/hooks/useSpills.ts

import { useState, useEffect, useCallback } from 'react';
import { NormalizedSpill } from '../types/spill';
import { getAllSpills } from '../services/spillsApi';

export function useSpills() {
  const [spills, setSpills] = useState<NormalizedSpill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllSpills();
      setSpills(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load spill data from API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { spills, isLoading, error, refetch: fetchAllData };
}
