// src/components/dashboard/LoadingState.tsx

import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Filters Skeleton */}
      <div className="h-12 bg-card/60 border border-border/50 rounded-xl w-full" />

      {/* KPI Skeleton Grid (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-card/60 border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            <div className="h-4 bg-muted/60 rounded w-1/2" />
            <div className="h-8 bg-muted/80 rounded w-3/4" />
            <div className="h-3 bg-muted/40 rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Analytics Grid 1 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-card/60 border border-border/50 rounded-xl p-5" />
        <div className="h-72 bg-card/60 border border-border/50 rounded-xl p-5" />
      </div>

      {/* Analytics Grid 2 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-card/60 border border-border/50 rounded-xl p-5" />
        <div className="h-72 bg-card/60 border border-border/50 rounded-xl p-5" />
      </div>

      {/* Table Skeleton */}
      <div className="h-80 bg-card/60 border border-border/50 rounded-xl p-5" />
    </div>
  );
};
