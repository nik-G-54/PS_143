// src/components/dashboard/KpiCard.tsx

import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-180 flex flex-col justify-between group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-180">
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl lg:text-3xl font-extrabold text-foreground font-mono tracking-tight leading-none mb-1">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground font-medium font-sans truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
