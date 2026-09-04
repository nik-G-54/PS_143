// src/utils/formatters.ts

export function formatArea(km2: number | null | undefined): string {
  if (km2 === null || km2 === undefined || isNaN(km2)) return 'N/A';
  return `${km2.toFixed(2)} km²`;
}

export function formatConfidence(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) return 'N/A';
  // score is 0.0 - 1.0 (e.g. 0.88 -> 88%)
  const percentage = Math.round(score * 100);
  return `${percentage}%`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return n.toLocaleString();
}
