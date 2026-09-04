// src/components/dashboard/KpiGrid.tsx

import React, { useMemo } from 'react';
import { KpiCard } from './KpiCard';
import { useDashboardContext } from '../../context/DashboardContext';
import { calculateTotalArea, calculateAverageConfidence, findLargestSpill } from '../../utils/spillAnalytics';
import { formatArea, formatConfidence, formatNumber } from '../../utils/formatters';
import { Waves, Maximize2, ShieldCheck, AlertTriangle } from 'lucide-react';

export const KpiGrid: React.FC = () => {
  const { filteredSpills, setSelectedSpillId } = useDashboardContext();

  const totalCount = filteredSpills.length;

  const totalArea = useMemo(() => calculateTotalArea(filteredSpills), [filteredSpills]);
  const avgConfidence = useMemo(() => calculateAverageConfidence(filteredSpills), [filteredSpills]);
  const largestSpill = useMemo(() => findLargestSpill(filteredSpills), [filteredSpills]);

  const handleLargestClick = () => {
    if (largestSpill) {
      setSelectedSpillId(largestSpill.id);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <KpiCard
        title="Total Spills"
        value={formatNumber(totalCount)}
        subtitle="Detected satellite events"
        icon={<AlertTriangle size={18} />}
      />

      <KpiCard
        title="Total Spill Area"
        value={formatArea(totalArea)}
        subtitle="Combined surface coverage"
        icon={<Waves size={18} />}
      />

      <KpiCard
        title="Average Confidence"
        value={formatConfidence(avgConfidence)}
        subtitle="Detection AI confidence score"
        icon={<ShieldCheck size={18} />}
      />

      <KpiCard
        title="Largest Spill"
        value={largestSpill ? formatArea(largestSpill.area) : 'N/A'}
        subtitle={largestSpill ? `ID: ${largestSpill.id}` : 'No spill data'}
        icon={<Maximize2 size={18} />}
        onClick={largestSpill ? handleLargestClick : undefined}
      />
    </div>
  );
};
