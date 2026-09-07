// src/components/investigation/DetectionEvidence.tsx

import React from 'react';
import { Activity } from 'lucide-react';
import { DiagnosticPlotViewer } from '../common/DiagnosticPlotViewer';

interface DetectionEvidenceProps {
  imageUrl?: string | null;
  spillId: string;
}

export const DetectionEvidence: React.FC<DetectionEvidenceProps> = ({ imageUrl, spillId }) => {
  return (
    <div className="flex flex-col gap-2.5 w-full bg-card/60 p-4 rounded-xl border border-border font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Diagnostic Evidence
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
          Drift Solution
        </span>
      </div>

      <DiagnosticPlotViewer
        spillId={spillId}
        fallbackUrl={imageUrl}
        alt={`Diagnostic plot evidence for ${spillId}`}
        containerClassName="aspect-[4/3] w-full min-h-[200px]"
        badgeText="Drift Diagnostic"
      />
    </div>
  );
};
