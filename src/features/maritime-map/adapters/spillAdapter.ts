import type { GeoBounds, MapSpill, RawSpillDetail, RawSpillListItem } from '../types/spillTypes';

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
    sourceType: null,
    estimatedAgeHours: null,
    estimatedReleaseTime: null,
    polygon: null,
    estimatedSourceLatitude: null,
    estimatedSourceLongitude: null,
    estimatedSourceRadiusKm: null,
    rankedTopVessel: null,
    rankedTopScore: null,
  };
}

/**
 * Augment a normalized MapSpill with detailed incident data from
 * `GET /api/v1/demo/spills/{spill_id}` (polygon, source estimates, age, etc.).
 */
export function adaptSpillDetail(
  base: MapSpill,
  raw: RawSpillDetail | null | undefined
): MapSpill {
  if (!raw) return base;

  // Validate polygon: array of [lon, lat] pairs
  let polygon: [number, number][] | null = null;
  if (Array.isArray(raw.polygon) && raw.polygon.length >= 3) {
    const validPts: [number, number][] = [];
    for (const pt of raw.polygon) {
      if (
        Array.isArray(pt) &&
        pt.length >= 2 &&
        isFiniteNumber(pt[0]) &&
        isFiniteNumber(pt[1]) &&
        pt[0] >= -180 &&
        pt[0] <= 180 &&
        pt[1] >= -90 &&
        pt[1] <= 90
      ) {
        validPts.push([pt[0], pt[1]]);
      }
    }
    if (validPts.length >= 3) {
      polygon = validPts;
    }
  }

  const sourceType =
    typeof raw.source_type === 'string' && raw.source_type.trim()
      ? raw.source_type.trim()
      : base.sourceType;

  const estimatedAgeHours =
    isFiniteNumber(raw.estimated_age_hours) && raw.estimated_age_hours >= 0
      ? raw.estimated_age_hours
      : base.estimatedAgeHours;

  const estimatedReleaseTime =
    typeof raw.estimated_release_time === 'string' && raw.estimated_release_time.trim()
      ? raw.estimated_release_time.trim()
      : base.estimatedReleaseTime;

  const srcLat =
    isFiniteNumber(raw.estimated_source_latitude) &&
    raw.estimated_source_latitude >= -90 &&
    raw.estimated_source_latitude <= 90
      ? raw.estimated_source_latitude
      : base.estimatedSourceLatitude;

  const srcLon =
    isFiniteNumber(raw.estimated_source_longitude) &&
    raw.estimated_source_longitude >= -180 &&
    raw.estimated_source_longitude <= 180
      ? raw.estimated_source_longitude
      : base.estimatedSourceLongitude;

  const srcRadius =
    isFiniteNumber(raw.estimated_source_radius_km) && raw.estimated_source_radius_km > 0
      ? raw.estimated_source_radius_km
      : base.estimatedSourceRadiusKm;

  const rankedTopVessel =
    typeof raw.ranked_top_vessel === 'string' && raw.ranked_top_vessel.trim()
      ? raw.ranked_top_vessel.trim()
      : base.rankedTopVessel;

  const rankedTopScore = isFiniteNumber(raw.ranked_top_score)
    ? clamp01(raw.ranked_top_score)
    : base.rankedTopScore;

  const imageUrl =
    typeof raw.image_url === 'string' && raw.image_url.length > 0
      ? raw.image_url
      : base.imageUrl;

  const candidateCount =
    isFiniteNumber(raw.candidate_count) && raw.candidate_count >= 0
      ? Math.trunc(raw.candidate_count)
      : base.candidateCount;

  return {
    ...base,
    sourceType,
    estimatedAgeHours,
    estimatedReleaseTime,
    polygon: polygon ?? base.polygon,
    estimatedSourceLatitude: srcLat,
    estimatedSourceLongitude: srcLon,
    estimatedSourceRadiusKm: srcRadius,
    rankedTopVessel,
    rankedTopScore,
    imageUrl,
    candidateCount,
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
