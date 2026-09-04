// src/components/dashboard/ErrorState.tsx

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Unable to load dashboard data. Please check your connection and try again.',
  onRetry,
}) => {
  return (
    <div className="w-full py-20 px-6 bg-card border border-destructive/30 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
      <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-lg font-bold text-foreground font-sans mb-2">Failed to Load Dashboard Data</h3>
      <p className="text-sm text-muted-foreground font-sans max-w-lg mb-6">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg shadow hover:bg-primary/90 transition-all duration-150"
        >
          <RefreshCw size={15} />
          <span>Retry Loading Data</span>
        </button>
      )}
    </div>
  );
};
