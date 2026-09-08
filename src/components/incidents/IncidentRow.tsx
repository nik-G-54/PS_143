import React from 'react';
import { Incident } from '../../types/incident';
import { formatArea, formatConfidence } from '../../utils/formatters';
import { formatIncidentDate } from '../../utils/dateUtils';
import { IncidentStatusBadge } from './IncidentStatusBadge';
import { ArrowRight } from 'lucide-react';

interface IncidentRowProps {
  incident: Incident;
  hasStatusColumn?: boolean;
  onViewClick: (id: string) => void;
}

export const IncidentRow: React.FC<IncidentRowProps> = React.memo(({ incident, hasStatusColumn, onViewClick }) => {
  const confDecimal = incident.confidence > 1 ? incident.confidence / 100 : incident.confidence;
  const confidencePct = Math.round(confDecimal * 100);

  // Semantic color for confidence (matches SpillTableRow)
  const confColorClass =
    confDecimal >= 0.75
      ? 'text-emerald-500 bg-emerald-500'
      : confDecimal >= 0.6
      ? 'text-amber-500 bg-amber-500'
      : 'text-destructive bg-destructive';

  return (
    <tr
      onClick={() => onViewClick(incident.id)}
      className="border-b border-border/50 cursor-pointer transition-all duration-150 group hover:bg-accent/40"
    >
      {/* Detected At */}
      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
        {incident.detectedAt ? formatIncidentDate(incident.detectedAt) : incident.date}
      </td>

      {/* Area */}
      <td className="py-3.5 px-4 font-mono text-xs font-extrabold text-foreground whitespace-nowrap">
        {formatArea(incident.spillArea)}
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
            {formatConfidence(confDecimal)}
          </span>
        </div>
      </td>

      {/* Status (Only if backend status exists) */}
      {hasStatusColumn && (
        <td className="py-3.5 px-4 whitespace-nowrap">
          {incident.status ? (
            <IncidentStatusBadge status={incident.status} />
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </td>
      )}

      {/* Action */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform duration-200">
          <span>View</span>
          <ArrowRight size={14} />
        </div>
      </td>
    </tr>
  );
});

IncidentRow.displayName = 'IncidentRow';

