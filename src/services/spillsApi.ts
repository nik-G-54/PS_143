// src/services/spillsApi.ts

import {
  SpillItemRaw,
  SpillPageResponse,
  SpillDetailRaw,
  NormalizedSpill,
  VisualizationResponse,
  FullVisualizationData,
} from '../types/spill';

const BASE_URL = 'https://naavss.duckdns.org/api/v1/demo/spills';
const VISUALIZATION_URL = 'https://naavss.duckdns.org/api/v1/visualization/spills';

export function normalizeSpill(item: SpillItemRaw): NormalizedSpill {
  return {
    id: item.spill_id,
    detectedAt: new Date(item.detected_at),
    area: typeof item.area_km2 === 'number' && !isNaN(item.area_km2) ? item.area_km2 : 0,
    confidence: typeof item.confidence_score === 'number' && !isNaN(item.confidence_score) ? item.confidence_score : 0,
    latitude: item.centroid?.lat ?? null,
    longitude: item.centroid?.lon ?? null,
    imageUrl: item.image_url ?? null,
    candidateCount: typeof item.candidate_count === 'number' ? item.candidate_count : 0,
  };
}

let spillsCache: NormalizedSpill[] | null = null;
let spillsFetchPromise: Promise<NormalizedSpill[]> | null = null;

export async function getSpills(page: number = 1, signal?: AbortSignal): Promise<SpillPageResponse> {
  const response = await fetch(`${BASE_URL}?page=${page}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch spills page ${page}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getAllSpills(): Promise<NormalizedSpill[]> {
  if (spillsCache && spillsCache.length > 0) {
    return spillsCache;
  }

  if (spillsFetchPromise) {
    return spillsFetchPromise;
  }

  spillsFetchPromise = (async () => {
    try {
      const firstPage = await getSpills(1);
      if (!firstPage || !Array.isArray(firstPage.items)) {
        return [];
      }

      const totalItems = firstPage.total || firstPage.items.length;
      const pageSize = firstPage.page_size || 20;
      const totalPages = Math.ceil(totalItems / pageSize);

      const firstPageNormalized = firstPage.items.map(normalizeSpill);

      if (totalPages <= 1) {
        spillsCache = firstPageNormalized;
        return firstPageNormalized;
      }

      // Concurrently fetch remaining pages with timeout safety
      const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      const settledResults = await Promise.allSettled(
        pageNumbers.map((p) =>
          fetch(`${BASE_URL}?page=${p}`, { signal: AbortSignal.timeout(10000) })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );

      const remainingRawItems: SpillItemRaw[] = [];
      for (const res of settledResults) {
        if (res.status === 'fulfilled' && res.value && Array.isArray(res.value.items)) {
          remainingRawItems.push(...res.value.items);
        }
      }

      const allNormalized = [...firstPage.items, ...remainingRawItems].map(normalizeSpill);
      spillsCache = allNormalized;
      return allNormalized;
    } catch (err) {
      console.error('Error fetching all spills from API:', err);
      return spillsCache || [];
    } finally {
      spillsFetchPromise = null;
    }
  })();

  return spillsFetchPromise;
}

export async function getSpillById(id: string, signal?: AbortSignal): Promise<SpillDetailRaw> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch spill detail for ${id}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getSpillVisualization(
  id: string,
  signal?: AbortSignal
): Promise<FullVisualizationData> {
  const [vizRes, detailRes] = await Promise.all([
    fetch(`${VISUALIZATION_URL}/${encodeURIComponent(id)}`, { signal }).then((r) => {
      if (!r.ok) throw new Error(`Visualization fetch failed for ${id}`);
      return r.json() as Promise<VisualizationResponse>;
    }),
    getSpillById(id, signal).catch(() => null), // Graceful fallback if detail endpoint fails
  ]);

  return {
    spillId: id,
    detectedAt: new Date(vizRes.spill.detected_at),
    latitude: vizRes.spill.latitude,
    longitude: vizRes.spill.longitude,
    area: detailRes?.area_km2 ?? 0,
    confidence: detailRes?.confidence_score ?? 0,
    imageUrl: detailRes?.image_url ?? null,
    candidateCount: detailRes?.candidate_count ?? 0,
    rankedTopVessel: detailRes?.ranked_top_vessel ?? null,
    estimatedAgeHours: detailRes?.estimated_age_hours ?? null,
    sourceType: detailRes?.source_type ?? null,
    sourceEstimate: vizRes.source_estimate ?? null,
    environment: vizRes.environment ?? null,
    trajectory: vizRes.trajectory || [],
  };
}

export interface CandidateVesselRaw {
  vessel_id: string;
  is_mock?: boolean;
  is_mock_comparison?: boolean;
  rank?: number | null;
  score?: number | null;
  vessel_name?: string;
  mmsi?: string;
  imo?: string;
  country?: string;
  shiptype?: number;
  shiptype_name?: string;
  vessel_type?: string;
  speed?: number;
  course?: number;
  heading?: number;
  distance_to_origin_km?: number;
  time_difference_hours?: number;
  trajectory_correlation?: number | null;
}

export async function getSpillVessels(id: string, signal?: AbortSignal): Promise<CandidateVesselRaw[]> {
  try {
    const res = await fetch(`https://naavss.duckdns.org/api/v1/demo/spills/${encodeURIComponent(id)}/vessels`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.vessels) ? data.vessels : [];
  } catch {
    return [];
  }
}

export async function getDiagnosticPlotUrl(id: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`https://naavss.duckdns.org/api/v1/drift/${encodeURIComponent(id)}/diagnostic-plot`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.diagnostic_plot_url || null;
  } catch {
    return null;
  }
}
