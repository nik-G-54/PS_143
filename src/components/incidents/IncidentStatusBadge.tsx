import React from 'react';
import { IncidentStatus } from '../../types/incident';

interface IncidentStatusBadgeProps {
  status: IncidentStatus;
}

export const IncidentStatusBadge: React.FC<IncidentStatusBadgeProps> = ({ status }) => {
  let badgeStyles = '';

  switch (status) {
    case 'ACTIVE':
      badgeStyles = 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/20 dark:text-[#4ADE80]';
      break;
    case 'INVESTIGATING':
      badgeStyles = 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/20 dark:text-[#FBBF24]';
      break;
    case 'RESOLVED':
      badgeStyles = 'bg-[#DBEAFE] text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#60A5FA]';
      break;
    default:
      badgeStyles = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.3px] transition-colors duration-150 ${badgeStyles}`}>
      {status}
    </span>
  );
};
