// src/components/dashboard/ConfidenceDistribution.tsx

import React, { useMemo } from 'react';
import { ChartCard } from './ChartCard';
import { useDashboardContext } from '../../context/DashboardContext';
import { buildConfidenceDistribution } from '../../utils/spillAnalytics';
import { ConfidenceBucket } from '../../types/spill';

export const ConfidenceDistribution: React.FC = () => {
  const { filteredSpills, filters, setFilters } = useDashboardContext();

  const buckets = useMemo(() => buildConfidenceDistribution(filteredSpills), [filteredSpills]);

  const maxCount = useMemo(() => {
    const counts = buckets.map((b) => b.count);
    return Math.max(...counts, 1);
  }, [buckets]);

  const handleBucketClick = (bucket: ConfidenceBucket) => {
    if (
      filters.confidenceRange &&
      filters.confidenceRange.min === bucket.minConfidence &&
      filters.confidenceRange.max === bucket.maxConfidence
    ) {
      setFilters({ confidenceRange: null });
    } else {
      setFilters({
        confidenceRange: { min: bucket.minConfidence, max: bucket.maxConfidence },
      });
    }
  };

  return (
    <ChartCard title="Confidence Distribution" subtitle="AI detection confidence score levels">
      <div className="flex flex-col gap-3 py-2 w-full font-sans">
        {buckets.map((bucket) => {
          const isSelected =
            filters.confidenceRange !== null &&
            filters.confidenceRange.min === bucket.minConfidence &&
            filters.confidenceRange.max === bucket.maxConfidence;

          const percentage = Math.round((bucket.count / maxCount) * 100);

          return (
            <div
              key={bucket.key}
              onClick={() => handleBucketClick(bucket)}
              className={`group cursor-pointer p-2 rounded-lg border transition-all duration-188 ${
                isSelected
                  ? 'bg-primary/10 border-primary shadow-sm'
                  : 'bg-card/40 border-transparent hover:bg-accent/60 hover:border-border'
              }`}
            >
              <div className="flex justify-between items-center text-xs mb-1">
                <span
                  className={`font-semibold font-mono ${
                    isSelected ? 'text-primary font-bold' : 'text-foreground'
                  }`}
                >
                  {bucket.label}
                </span>
                <span className="font-mono text-muted-foreground group-hover:text-foreground font-bold">
                  {bucket.count} {bucket.count === 1 ? 'spill' : 'spills'}
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary'
                      : 'bg-chart-2/80 group-hover:bg-primary'
                  }`}
                  style={{ width: `${Math.max(percentage, bucket.count > 0 ? 6 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
};
