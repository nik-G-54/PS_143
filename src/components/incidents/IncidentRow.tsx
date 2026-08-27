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
        return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/40';
      case 'HIGH':
        return 'bg-[#FEE2E2] text-[#DC2626] dark:bg-red-950/20 dark:text-[#F87171] border border-red-100 dark:border-red-900/30';
      case 'MEDIUM':
        return 'bg-[#FEF3C7] text-[#EA580C] dark:bg-amber-950/20 dark:text-[#FBBF24] border border-amber-100 dark:border-amber-900/30';
      case 'LOW':
        return 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/20 dark:text-[#34D399] border border-emerald-100 dark:border-emerald-900/30';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <tr className="h-[72px] border-b border-[#F0F0F0] dark:border-[#252830] hover:bg-[#FAFBFC] dark:hover:bg-[#1E2130] transition-colors duration-150">
      {/* ID */}
      <td className="px-5 py-4 align-middle">
        <span 
          onClick={() => onViewClick(incident.id)}
          className="font-mono text-sm font-semibold text-[#00B894] dark:text-[#00D9A6] cursor-pointer hover:underline"
        >
          {incident.id}
        </span>
      </td>

      {/* Date */}
      <td className="px-5 py-4 align-middle text-sm text-[#4B5563] dark:text-[#94A3B8]">
        {incident.date}
      </td>

      {/* Location */}
      <td className="px-5 py-4 align-middle">
        <div className="text-sm font-medium text-[#1A1D23] dark:text-[#F1F5F9]">{incident.locationName}</div>
        <div className="text-xs text-[#9CA3AF] dark:text-[#64748B] font-mono mt-0.5">
          {incident.latitude.toFixed(4)}°N, {incident.longitude.toFixed(4)}°E
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4 align-middle">
        <IncidentStatusBadge status={incident.status} />
      </td>

      {/* Confidence */}
      <td className="px-5 py-4 align-middle text-sm font-semibold text-[#00B894] dark:text-[#00D9A6]">
        {incident.confidence}%
      </td>

      {/* Severity */}
      <td className="px-5 py-4 align-middle">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.3px] ${getSeverityStyle(incident.severity)}`}>
          {incident.severity}
        </span>
      </td>

      {/* Vessel involved */}
      <td className="px-5 py-4 align-middle text-sm font-medium text-[#1A1D23] dark:text-[#F1F5F9]">
        {incident.vesselInvolved}
      </td>

      {/* Spill area */}
      <td className="px-5 py-4 align-middle text-sm">
        <span className="text-base font-bold text-[#1A1D23] dark:text-[#F1F5F9]">{incident.spillArea}</span>
        <span className="text-xs text-[#9CA3AF] dark:text-[#64748B] ml-0.5">km²</span>
      </td>

      {/* Actions */}
      <td className="px-5 py-4 align-middle text-right">
        <button
          onClick={() => onViewClick(incident.id)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#252830] bg-white dark:bg-[#1A1D27] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#00B894] dark:hover:border-[#00D9A6] hover:text-[#00B894] dark:hover:text-[#00D9A6] hover:bg-[rgba(0,184,148,0.04)] dark:hover:bg-[rgba(0,217,166,0.1)] transition-all duration-150"
          title="View 3D Incident Reconstruction"
        >
          <Eye size={16} strokeWidth={1.5} />
        </button>
      </td>
    </tr>
  );
});

IncidentRow.displayName = 'IncidentRow';
