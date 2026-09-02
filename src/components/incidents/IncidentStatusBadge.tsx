import React from 'react';
import { IncidentStatus } from '../../types/incident';

interface IncidentStatusBadgeProps {
  status: IncidentStatus;
}

export const IncidentStatusBadge: React.FC<IncidentStatusBadgeProps> = ({ status }) => {
  let badgeStyles = '';

  switch (status) {
    case 'ACTIVE':
      badgeStyles = 'bg-[#ea580c]/15 text-[#ea580c] border-2 border-[#ea580c] dark:bg-[#f97316]/20 dark:text-[#f97316] dark:border-[#f97316] font-bold shadow-xs';
      break;
    case 'INVESTIGATING':
      badgeStyles = 'bg-[#d97706]/15 text-[#d97706] border-2 border-[#d97706] dark:bg-[#fbbf24]/20 dark:text-[#fbbf24] dark:border-[#fbbf24] font-bold shadow-xs';
      break;
    case 'RESOLVED':
      badgeStyles = 'bg-muted text-muted-foreground border-2 border-border font-bold shadow-xs';
      break;
    default:
      badgeStyles = 'bg-muted text-foreground border-2 border-border font-bold shadow-xs';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs uppercase tracking-[0.3px] transition-colors duration-150 font-sans ${badgeStyles}`}>
      {status}
    </span>
  );
};
