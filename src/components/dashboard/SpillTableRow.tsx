// src/components/dashboard/SpillTableRow.tsx

import React from 'react';
import { NormalizedSpill } from '../../types/spill';
import { formatArea, formatConfidence } from '../../utils/formatters';
import { formatIncidentDate } from '../../utils/dateUtils';
import { ArrowRight } from 'lucide-react';

interface SpillTableRowProps {
  spill: NormalizedSpill;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export const SpillTableRow: React.FC<SpillTableRowProps> = ({ spill, isSelected, onClick }) => {
  return (
    <tr
      onClick={() => onClick(spill.id)}
      className={`border-b border-border/50 cursor-pointer transition-colors duration-150 group hover:bg-primary/5 ${
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : ''
      }`}
    >
      {/* Detected At: 13 Jan · 03:42 */}
      <td className="py-3 px-4 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
        {formatIncidentDate(spill.detectedAt)}
      </td>

      {/* Area */}
      <td className="py-3 px-4 font-mono text-xs font-extrabold text-foreground whitespace-nowrap">
        {formatArea(spill.area)}
      </td>

      {/* Confidence */}
      <td className="py-3 px-4 font-mono text-xs text-foreground whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
            spill.confidence >= 0.8
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : spill.confidence >= 0.65
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {formatConfidence(spill.confidence)}
        </span>
      </td>

      {/* Action */}
      <td className="py-3 px-4 text-right">
        <div className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform duration-150">
          <ArrowRight size={15} />
        </div>
      </td>
    </tr>
  );
};
