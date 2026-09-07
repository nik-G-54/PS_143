// src/services/spillsApi.ts

import {
  SpillItemRaw,
  SpillPageResponse,
  SpillDetailRaw,
  NormalizedSpill,
  VisualizationResponse,
  FullVisualizationData,
} from '../types/spill';
import { fetchDiagnosticPlotUrl } from './diagnosticPlotService';

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

export async function getSpills(page: number = 1): Promise<SpillPageResponse> {
  const response = await fetch(`${BASE_URL}?page=${page}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch spills page ${page}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getAllSpills(): Promise<NormalizedSpill[]> {
  const firstPage = await getSpills(1);
  if (!firstPage || !Array.isArray(firstPage.items)) {
    return [];
  }

  const totalPages = Math.ceil((firstPage.total || 0) / (firstPage.page_size || 20));

  if (totalPages <= 1) {
    return firstPage.items.map(normalizeSpill);
  }

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => getSpills(i + 2))
  );

  const allRawItems = [
    ...firstPage.items,
    ...remaining.flatMap((p) => (p && Array.isArray(p.items) ? p.items : [])),
  ];

  return allRawItems.map(normalizeSpill);
}

export async function getSpillById(id: string, signal?: AbortSignal): Promise<SpillDetailRaw> {
  const [response, diagUrl] = await Promise.all([
    fetch(`${BASE_URL}/${encodeURIComponent(id)}`, { signal }),
    fetchDiagnosticPlotUrl(id, signal).catch(() => null),
  ]);
  if (!response.ok) {
    throw new Error(`Failed to fetch spill detail for ${id}: ${response.status} ${response.statusText}`);
  }
  const data: SpillDetailRaw = await response.json();
  if (diagUrl) {
    data.image_url = diagUrl;
  }
  return data;
}

export async function getSpillVisualization(
  id: string,
  signal?: AbortSignal
): Promise<FullVisualizationData> {
  const [vizRes, detailRes, diagUrl] = await Promise.all([
    fetch(`${VISUALIZATION_URL}/${encodeURIComponent(id)}`, { signal }).then((r) => {
      if (!r.ok) throw new Error(`Visualization fetch failed for ${id}`);
      return r.json() as Promise<VisualizationResponse>;
    }),
    getSpillById(id, signal).catch(() => null), // Graceful fallback if detail endpoint fails
    fetchDiagnosticPlotUrl(id, signal).catch(() => null),
  ]);

  return {
    spillId: id,
    detectedAt: new Date(vizRes.spill.detected_at),
    latitude: vizRes.spill.latitude,
    longitude: vizRes.spill.longitude,
    area: detailRes?.area_km2 ?? 0,
    confidence: detailRes?.confidence_score ?? 0,
    imageUrl: diagUrl || detailRes?.image_url || null,
    candidateCount: detailRes?.candidate_count ?? 0,
    rankedTopVessel: detailRes?.ranked_top_vessel ?? null,
    estimatedAgeHours: detailRes?.estimated_age_hours ?? null,
    sourceType: detailRes?.source_type ?? null,
    sourceEstimate: vizRes.source_estimate ?? null,
    environment: vizRes.environment ?? null,
    trajectory: vizRes.trajectory || [],
  };
}
