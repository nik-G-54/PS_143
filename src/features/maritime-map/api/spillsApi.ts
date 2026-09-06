import { apiClient } from '../../../services/apiClient';
import type { RawSpillListItem, RawSpillListResponse } from '../types/spillTypes';

/**
 * Page size we ask for. The backend caps this — a larger value is rejected with
 * HTTP 422 — and it is free to hand back a different `page_size` than requested,
 * so `fetchAllSpills` always paginates off the values in the *response* instead
 * of trusting this constant.
 */
const REQUESTED_PAGE_SIZE = 100;

/** Hard stop so an inconsistent `total`/`page_size` pair can never loop forever. */
const MAX_PAGES = 50;

/** Fetch a single page of detected oil spills. */
export function fetchSpillsPage(
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<RawSpillListResponse> {
  return apiClient.get<RawSpillListResponse>(
    `/api/v1/demo/spills?page=${page}&page_size=${pageSize}`,
    signal
  );
}

/**
 * Fetch every detected oil spill, following the backend's own pagination.
 *
 * Reads `total` and `page_size` off the first response and derives the remaining
 * page numbers from them, so this works whether the backend serves all records
 * in one page or splits them across several.
 */
export async function fetchAllSpills(signal?: AbortSignal): Promise<RawSpillListItem[]> {
  const first = await fetchSpillsPage(1, REQUESTED_PAGE_SIZE, signal);
  const items: RawSpillListItem[] = [...(first.items ?? [])];

  const total = Number.isFinite(first.total) ? (first.total as number) : items.length;
  // Trust the page size the backend actually applied, falling back to what it sent us.
  const pageSize =
    Number.isFinite(first.page_size) && (first.page_size as number) > 0
      ? (first.page_size as number)
      : items.length;

  if (pageSize <= 0 || items.length >= total) return items;

  const totalPages = Math.min(Math.ceil(total / pageSize), MAX_PAGES);
  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchSpillsPage(index + 2, pageSize, signal)
    )
  );

  for (const page of remaining) items.push(...(page.items ?? []));
  return items;
}
