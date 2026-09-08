// src/components/dashboard/ChartCard.tsx

import React from 'react';

interface ChartCardProps {
  title: React.ReactNode;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between h-full ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-4 shrink-0">
        <div>
          <div className="text-base font-bold text-foreground font-sans tracking-tight">{title}</div>
          {subtitle && <p className="text-xs text-muted-foreground font-medium font-sans mt-0.5">{subtitle}</p>}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      <div className="flex-1 w-full relative flex flex-col justify-center">{children}</div>
    </div>
  );
};
