// src/components/dashboard/SpillTableRow.tsx

import React from 'react';
import { NormalizedSpill } from '../../types/spill';
import { formatArea, formatConfidence } from '../../utils/formatters';
import { formatIncidentDate } from '../../utils/dateUtils';
import { ArrowRight } from 'lucide-react';

interface SpillTableRowProps {
  spill: NormalizedSpill;
  topVessel?: string | null;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export const SpillTableRow: React.FC<SpillTableRowProps> = ({
  spill,
  topVessel,
  isSelected,
  onClick,
}) => {
  const confidencePct = Math.round((spill.confidence || 0) * 100);

  // Semantic color for confidence
  const confColorClass =
    spill.confidence >= 0.75
      ? 'text-emerald-500 bg-emerald-500'
      : spill.confidence >= 0.6
      ? 'text-amber-500 bg-amber-500'
      : 'text-destructive bg-destructive';

  return (
    <tr
      onClick={() => onClick(spill.id)}
      className={`border-b border-border/50 cursor-pointer transition-all duration-150 group hover:bg-accent/40 ${
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : ''
      }`}
    >
      {/* Spill ID */}
      <td className="py-3.5 px-4 font-mono text-xs font-bold text-primary whitespace-nowrap">
        {spill.id}
      </td>

      {/* Detected At */}
      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
        {formatIncidentDate(spill.detectedAt)}
      </td>

      {/* Area */}
      <td className="py-3.5 px-4 font-mono text-xs font-extrabold text-foreground whitespace-nowrap">
        {formatArea(spill.area)}
      </td>

      {/* Confidence Thin Meter + Percentage */}
      <td className="py-3.5 px-4 font-mono text-xs text-foreground whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden flex shrink-0 border border-border/40">
            <div
              className={`h-full rounded-full transition-all duration-300 ${confColorClass}`}
              style={{ width: `${Math.max(10, Math.min(100, confidencePct))}%` }}
            />
          </div>
          <span className={`text-[11px] font-bold ${confColorClass.split(' ')[0]}`}>
            {formatConfidence(spill.confidence)}
          </span>
        </div>
      </td>

      {/* Rank 1 Vessel ID */}
      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
        {topVessel === undefined ? (
          <span className="inline-block w-24 h-4 bg-muted/60 animate-pulse rounded" />
        ) : topVessel ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
            {topVessel}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs font-mono">—</span>
        )}
      </td>

      {/* Action */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform duration-200">
          <span>View</span>
          <ArrowRight size={14} />
        </div>
      </td>
    </tr>
  );
};
