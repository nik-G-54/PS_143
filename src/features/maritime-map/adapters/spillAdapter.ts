import type { GeoBounds, MapSpill, RawSpillListItem } from '../types/spillTypes';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Normalize one raw spill record.
 *
 * Returns null when the record cannot be placed on the map — a spill without a
 * usable id or centroid is not renderable, and silently drawing it at [0, 0]
 * would put a phantom incident in the Gulf of Guinea.
 */
export function adaptSpill(raw: RawSpillListItem | null | undefined): MapSpill | null {
  if (!raw || typeof raw.spill_id !== 'string' || raw.spill_id.length === 0) return null;

  const longitude = raw.centroid?.lon;
  const latitude = raw.centroid?.lat;
  if (!isFiniteNumber(longitude) || !isFiniteNumber(latitude)) return null;
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;

  const detectedAt = typeof raw.detected_at === 'string' ? raw.detected_at : '';
  const parsedMs = detectedAt ? Date.parse(detectedAt) : Number.NaN;

  return {
    spillId: raw.spill_id,
    detectedAt,
    detectedAtMs: Number.isNaN(parsedMs) ? null : parsedMs,
    longitude,
    latitude,
    areaKm2: isFiniteNumber(raw.area_km2) && raw.area_km2 >= 0 ? raw.area_km2 : null,
    confidenceScore: isFiniteNumber(raw.confidence_score)
      ? clamp01(raw.confidence_score)
      : null,
    candidateCount:
      isFiniteNumber(raw.candidate_count) && raw.candidate_count >= 0
        ? Math.trunc(raw.candidate_count)
        : null,
    imageUrl:
      typeof raw.image_url === 'string' && raw.image_url.length > 0 ? raw.image_url : null,
  };
}

/**
 * Normalize a raw spill list, dropping unrenderable records and sorting newest
 * detection first so the list order is stable across reloads.
 */
export function adaptSpillList(rawItems: RawSpillListItem[] | null | undefined): MapSpill[] {
  const spills: MapSpill[] = [];
  let rejected = 0;

  for (const raw of rawItems ?? []) {
    const spill = adaptSpill(raw);
    if (spill) spills.push(spill);
    else rejected += 1;
  }

  if (rejected > 0) {
    console.warn(
      `[spillAdapter] dropped ${rejected} spill record(s) with a missing id or invalid centroid`
    );
  }

  spills.sort((a, b) => (b.detectedAtMs ?? 0) - (a.detectedAtMs ?? 0));
  return spills;
}

/** Bounding box covering every spill, or null for an empty list. */
export function getSpillBounds(spills: MapSpill[]): GeoBounds | null {
  if (spills.length === 0) return null;

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const spill of spills) {
    if (spill.longitude < minLon) minLon = spill.longitude;
    if (spill.longitude > maxLon) maxLon = spill.longitude;
    if (spill.latitude < minLat) minLat = spill.latitude;
    if (spill.latitude > maxLat) maxLat = spill.latitude;
  }

  return { minLon, minLat, maxLon, maxLat };
}
