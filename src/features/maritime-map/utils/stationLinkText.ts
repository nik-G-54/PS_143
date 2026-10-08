// Wording for the nearest-coast-guard line: its map label, its hover tooltip
// and the station card's distance line. Pure, so the km / nautical-mile
// formatting is tested once and the three surfaces can never disagree.

import type { CoastGuardStation } from '../types/alertTypes';

const EM_DASH = '—';

/** International nautical mile, exact: 1 nm = 1.852 km. */
export const KM_PER_NM = 1.852;

export const kmToNm = (km: number): number => km / KM_PER_NM;

const usable = (km: number | null | undefined): km is number =>
  typeof km === 'number' && Number.isFinite(km) && km >= 0;

/** Compact form for the on-map label: "5.6 km" under 10 km, "42 km" above. */
export function formatDistanceShort(km: number | null | undefined): string {
  if (!usable(km)) return EM_DASH;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Both units to one decimal: "20.6 km · 11.1 nm". */
export function formatKmAndNm(km: number | null | undefined): string {
  if (!usable(km)) return EM_DASH;
  return `${km.toFixed(1)} km · ${kmToNm(km).toFixed(1)} nm`;
}

/** The pill pinned at the line's midpoint. */
export function buildLinkLabel(distanceKm: number | null | undefined): string {
  return `NEAREST COAST GUARD · ${formatDistanceShort(distanceKm)}`;
}

export interface LinkTooltipContent {
  title: string;
  /** Label/value rows, in display order. */
  rows: { label: string; value: string }[];
  /** One-line explanation of what the line means. */
  note: string;
}

export const LINK_TOOLTIP_TITLE = 'Nearest coast guard station';
export const LINK_TOOLTIP_NOTE =
  'Who would receive an alert for this spill. Straight-line (great-circle) distance, not a sailing route.';

export function buildLinkTooltip(
  station: Pick<CoastGuardStation, 'name' | 'organisation'>,
  distanceKm: number | null | undefined
): LinkTooltipContent {
  return {
    title: LINK_TOOLTIP_TITLE,
    rows: [
      { label: 'Station', value: station.name || EM_DASH },
      { label: 'Organisation', value: station.organisation || EM_DASH },
      { label: 'Distance', value: formatKmAndNm(distanceKm) },
    ],
    note: LINK_TOOLTIP_NOTE,
  };
}
