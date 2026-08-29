// src/components/map/JobProgress.tsx
import React from 'react';
import type { JobStatus } from '../../types/map';
import { Loader2 } from 'lucide-react';

interface JobProgressProps {
  job: JobStatus | null;
}

export const JobProgress: React.FC<JobProgressProps> = React.memo(({ job }) => {
  if (!job || job.status === 'completed' || job.status === 'failed') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-[240px] right-0 h-14 bg-[#1A1D27] border-t border-[#252830] z-20 flex items-center justify-between px-6">
      {/* Label and Stage */}
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 text-[#00D9A6] animate-spin shrink-0" />
        <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
          <span className="text-xs font-semibold text-[#F1F5F9]">
            {job.stage}
          </span>
          <span className="text-[10px] text-[#64748B] font-mono truncate max-w-[300px] md:max-w-none">
            {job.message}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-4 w-[30%] min-w-[180px] max-w-[300px]">
        <span className="text-xs text-[#94A3B8] font-bold font-mono">
          {job.progress}%
        </span>
        <div className="flex-1 h-1.5 bg-[#252830] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00D9A6] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});

JobProgress.displayName = 'JobProgress';
