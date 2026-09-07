import { useEffect, useState } from 'react';
import { spillService } from '../../../services/spillService';
import { adaptSpillDetail } from '../adapters/spillAdapter';
import type { MapSpill, RawSpillDetail } from '../types/spillTypes';
import { fetchDiagnosticPlotUrl } from '../../../services/diagnosticPlotService';

export interface UseSpillDetailsResult {
  spill: MapSpill | null;
  isLoading: boolean;
  error: string | null;
}

interface SpillDetailsState {
  spillId: string | null;
  spill: MapSpill | null;
  error: string | null;
}

const EMPTY_STATE: SpillDetailsState = { spillId: null, spill: null, error: null };

/**
 * Load detailed incident metadata (polygon, source estimates, age, etc.)
 * from `GET /api/v1/demo/spills/{spill_id}` using existing spillService.
 */
export function useSpillDetails(baseSpill: MapSpill | null): UseSpillDetailsResult {
  const [state, setState] = useState<SpillDetailsState>(EMPTY_STATE);
  const spillId = baseSpill?.spillId ?? null;

  useEffect(() => {
    if (!baseSpill || !spillId) return;

    let active = true;

    Promise.all([
      spillService.getSpill(spillId),
      fetchDiagnosticPlotUrl(spillId).catch(() => null)
    ])
      .then(([rawDetail, diagUrl]: [RawSpillDetail, string | null]) => {
        if (!active) return;
        if (diagUrl && rawDetail) {
          rawDetail.image_url = diagUrl;
        }
        const enriched = adaptSpillDetail(baseSpill, rawDetail);
        if (diagUrl) {
          enriched.imageUrl = diagUrl;
        }
        setState({
          spillId,
          spill: enriched,
          error: null,
        });
      })
      .catch(async (err: unknown) => {
        if (!active) return;
        console.warn(`[useSpillDetails] detail fetch failed for ${spillId}, using base spill`, err);
        const diagUrl = await fetchDiagnosticPlotUrl(spillId).catch(() => null);
        const fallbackSpill = diagUrl ? { ...baseSpill, imageUrl: diagUrl } : baseSpill;
        setState({
          spillId,
          spill: fallbackSpill,
          error: 'Could not load full incident details; showing list observation.',
        });
      });

    return () => {
      active = false;
    };
  }, [baseSpill, spillId]);

  if (!baseSpill || !spillId) {
    return { spill: null, isLoading: false, error: null };
  }

  const isResolved = state.spillId === spillId;

  return {
    spill: isResolved ? state.spill : baseSpill,
    isLoading: !isResolved,
    error: isResolved ? state.error : null,
  };
}