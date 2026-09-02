import React from 'react';
import { Incident } from '../../types/incident';
import { IncidentStatusBadge } from './IncidentStatusBadge';
import { Eye } from 'lucide-react';

interface IncidentRowProps {
  incident: Incident;
  onViewClick: (id: string) => void;
}

export const IncidentRow: React.FC<IncidentRowProps> = React.memo(({ incident, onViewClick }) => {
  const getSeverityStyle = (severity: Incident['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#dc2626]/15 text-[#dc2626] border-2 border-[#dc2626] dark:border-[#ef4444] dark:bg-[#ef4444]/20 dark:text-[#ef4444] font-bold shadow-xs';
      case 'HIGH':
        return 'bg-[#ea580c]/15 text-[#ea580c] border-2 border-[#ea580c] dark:border-[#f97316] dark:bg-[#f97316]/20 dark:text-[#f97316] font-bold shadow-xs';
      case 'MEDIUM':
        return 'bg-[#ca8a04]/15 text-[#ca8a04] border-2 border-[#ca8a04] dark:border-[#facc15] dark:bg-[#facc15]/20 dark:text-[#facc15] font-bold shadow-xs';
      case 'LOW':
        return 'bg-[#64748b]/15 text-[#475569] border-2 border-[#64748b] dark:border-[#94a3b8] dark:bg-[#64748b]/20 dark:text-[#94a3b8] font-bold shadow-xs';
      default:
        return 'bg-muted text-muted-foreground border-2 border-border font-bold shadow-xs';
    }
  };

  return (
    <tr className="h-[72px] border-b border-border hover:bg-accent/50 transition-colors duration-150">
      {/* ID */}
      <td className="px-5 py-4 align-middle">
        <span 
          onClick={() => onViewClick(incident.id)}
          className="font-mono text-sm font-semibold text-primary cursor-pointer hover:underline"
        >
          {incident.id}
        </span>
      </td>

      {/* Date */}
      <td className="px-5 py-4 align-middle text-sm text-muted-foreground font-sans">
        {incident.date}
      </td>

      {/* Location */}
      <td className="px-5 py-4 align-middle">
        <div className="text-sm font-medium text-foreground font-sans">{incident.locationName}</div>
        <div className="text-xs text-muted-foreground font-mono mt-0.5">
          {incident.latitude.toFixed(4)}°N, {incident.longitude.toFixed(4)}°E
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4 align-middle">
        <IncidentStatusBadge status={incident.status} />
      </td>

      {/* Confidence */}
      <td className="px-5 py-4 align-middle text-sm font-semibold text-primary font-mono">
        {incident.confidence}%
      </td>

      {/* Severity */}
      <td className="px-5 py-4 align-middle">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs uppercase tracking-[0.3px] font-sans ${getSeverityStyle(incident.severity)}`}>
          {incident.severity}
        </span>
      </td>

      {/* Vessel involved */}
      <td className="px-5 py-4 align-middle text-sm font-medium text-foreground font-sans">
        {incident.vesselInvolved}
      </td>

      {/* Spill area */}
      <td className="px-5 py-4 align-middle text-sm">
        <span className="text-base font-bold text-foreground font-mono">{incident.spillArea}</span>
        <span className="text-xs text-muted-foreground ml-0.5 font-sans">km²</span>
      </td>

      {/* Actions */}
      <td className="px-5 py-4 align-middle text-right">
        <button
          onClick={() => onViewClick(incident.id)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-all duration-150"
          title="View 3D Incident Reconstruction"
        >
          <Eye size={16} strokeWidth={1.5} />
        </button>
      </td>
    </tr>
  );
});

IncidentRow.displayName = 'IncidentRow';
