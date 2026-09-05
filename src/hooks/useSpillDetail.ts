// src/hooks/useSpillDetail.ts
import { useState, useEffect } from 'react';
import type { SpillDetail, VesselCandidate, VisualizationData } from '../types/detail';

const API_BASE = 'https://naavss.duckdns.org/api/v1/demo';

interface SpillDetailData {
  spill: SpillDetail | null;
  vessels: VesselCandidate[];
  visualization: VisualizationData | null;
  loading: boolean;
}

export function useSpillDetail(spillId: string | null): SpillDetailData {
  const [spill, setSpill] = useState<SpillDetail | null>(null);
  const [vessels, setVessels] = useState<VesselCandidate[]>([]);
  const [visualization, setVisualization] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!spillId) {
      setSpill(null);
      setVessels([]);
      setVisualization(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    async function fetchAll() {
      try {
        const [spillRes, vesselsRes, vizRes] = await Promise.all([
          fetch(`${API_BASE}/spills/${spillId}`, { signal: controller.signal }),
          fetch(`${API_BASE}/spills/${spillId}/vessels`, { signal: controller.signal }),
          fetch(`https://naavss.duckdns.org/api/v1/visualization/spills/${spillId}`, { signal: controller.signal }),
        ]);

        const [spillData, vesselsData, vizData] = await Promise.all([
          spillRes.json(),
          vesselsRes.json(),
          vizRes.json(),
        ]);

        setSpill(spillData);
        setVessels(vesselsData.vessels || []);
        setVisualization(vizData);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Failed to fetch spill detail:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
    return () => controller.abort();
  }, [spillId]);

  return { spill, vessels, visualization, loading };
}
