// src/utils/spillAnalytics.ts

import { NormalizedSpill, TrendPoint, SizeBucket, ConfidenceBucket, HeatmapCell } from '../types/spill';
import { getDateKey, formatDate } from './dateUtils';

export function calculateTotalArea(spills: NormalizedSpill[]): number {
  return spills.reduce((acc, spill) => acc + (spill.area || 0), 0);
}

export function calculateAverageConfidence(spills: NormalizedSpill[]): number {
  if (spills.length === 0) return 0;
  const sum = spills.reduce((acc, spill) => acc + (spill.confidence || 0), 0);
  return sum / spills.length;
}

export function findLargestSpill(spills: NormalizedSpill[]): NormalizedSpill | null {
  if (spills.length === 0) return null;
  return spills.reduce((max, spill) => (spill.area > max.area ? spill : max), spills[0]);
}

export function buildTrendData(spills: NormalizedSpill[]): TrendPoint[] {
  const map = new Map<string, { date: Date; count: number; totalArea: number; confidenceSum: number }>();

  spills.forEach((spill) => {
    const dateKey = getDateKey(spill.detectedAt);
    const existing = map.get(dateKey);
    if (existing) {
      existing.count += 1;
      existing.totalArea += spill.area;
      existing.confidenceSum += spill.confidence;
    } else {
      map.set(dateKey, {
        date: spill.detectedAt,
        count: 1,
        totalArea: spill.area,
        confidenceSum: spill.confidence,
      });
    }
  });

  const points: TrendPoint[] = Array.from(map.entries()).map(([dateStr, item]) => ({
    dateStr,
    displayDate: formatDate(item.date),
    date: item.date,
    count: item.count,
    totalArea: item.totalArea,
    avgConfidence: item.count > 0 ? item.confidenceSum / item.count : 0,
  }));

  return points.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function buildSizeDistribution(spills: NormalizedSpill[]): SizeBucket[] {
  const buckets: SizeBucket[] = [
    { key: '<0.5', label: '< 0.5 km²', minArea: 0, maxArea: 0.5, count: 0 },
    { key: '0.5-1', label: '0.5–1 km²', minArea: 0.5, maxArea: 1, count: 0 },
    { key: '1-2', label: '1–2 km²', minArea: 1, maxArea: 2, count: 0 },
    { key: '2-5', label: '2–5 km²', minArea: 2, maxArea: 5, count: 0 },
    { key: '5+', label: '5+ km²', minArea: 5, maxArea: Number.POSITIVE_INFINITY, count: 0 },
  ];

  spills.forEach((spill) => {
    const area = spill.area;
    if (area < 0.5) buckets[0].count++;
    else if (area >= 0.5 && area < 1) buckets[1].count++;
    else if (area >= 1 && area < 2) buckets[2].count++;
    else if (area >= 2 && area < 5) buckets[3].count++;
    else if (area >= 5) buckets[4].count++;
  });

  return buckets;
}

export function buildConfidenceDistribution(spills: NormalizedSpill[]): ConfidenceBucket[] {
  const buckets: ConfidenceBucket[] = [
    { key: '50-60', label: '50–60%', minConfidence: 0.5, maxConfidence: 0.6, count: 0 },
    { key: '60-70', label: '60–70%', minConfidence: 0.6, maxConfidence: 0.7, count: 0 },
    { key: '70-80', label: '70–80%', minConfidence: 0.7, maxConfidence: 0.8, count: 0 },
    { key: '80-90', label: '80–90%', minConfidence: 0.8, maxConfidence: 0.9, count: 0 },
    { key: '90-100', label: '90–100%', minConfidence: 0.9, maxConfidence: 1.0, count: 0 },
  ];

  spills.forEach((spill) => {
    const conf = spill.confidence;
    if (conf >= 0.5 && conf < 0.6) buckets[0].count++;
    else if (conf >= 0.6 && conf < 0.7) buckets[1].count++;
    else if (conf >= 0.7 && conf < 0.8) buckets[2].count++;
    else if (conf >= 0.8 && conf < 0.9) buckets[3].count++;
    else if (conf >= 0.9 && conf <= 1.0) buckets[4].count++;
  });

  return buckets;
}

export function buildHeatmapData(spills: NormalizedSpill[]): HeatmapCell[] {
  const map = new Map<string, { date: Date; count: number }>();

  spills.forEach((spill) => {
    const dateKey = getDateKey(spill.detectedAt);
    const existing = map.get(dateKey);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(dateKey, { date: spill.detectedAt, count: 1 });
    }
  });

  const cells: HeatmapCell[] = Array.from(map.entries()).map(([dateKey, item]) => ({
    dateKey,
    displayDate: formatDate(item.date),
    date: item.date,
    count: item.count,
    monthIndex: item.date.getMonth(),
    dayOfWeek: item.date.getDay(),
  }));

  return cells.sort((a, b) => a.date.getTime() - b.date.getTime());
}
