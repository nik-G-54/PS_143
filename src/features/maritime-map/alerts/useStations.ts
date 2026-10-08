import { useEffect, useState } from 'react';
import { loadStations } from '../config/stationsConfig';
import type { CoastGuardStation } from '../types/alertTypes';

const NO_STATIONS: CoastGuardStation[] = [];

/** Loads the static station list once. A failed load leaves the list empty — the map and panels simply have no stations. */
export function useStations(): CoastGuardStation[] {
  const [stations, setStations] = useState<CoastGuardStation[]>(NO_STATIONS);

  useEffect(() => {
    const controller = new AbortController();
    loadStations(controller.signal)
      .then(setStations)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('[useStations] could not load coast guard stations', cause);
      });
    return () => controller.abort();
  }, []);

  return stations;
}
