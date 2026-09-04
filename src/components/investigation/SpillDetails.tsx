// src/components/investigation/SpillDetails.tsx

import React from 'react';
import { formatArea, formatConfidence } from '../../utils/formatters';
import { Layers, Ship, ShieldCheck, Clock, FileText } from 'lucide-react';

interface SpillDetailsProps {
  area: number;
  confidence: number;
  estimatedAgeHours?: number | null;
  candidateCount?: number;
  rankedTopVessel?: string | null;
}

export const SpillDetails: React.FC<SpillDetailsProps> = ({
  area,
  confidence,
  estimatedAgeHours,
  candidateCount = 0,
  rankedTopVessel,
}) => {
  return (
    <div className="flex flex-col gap-2.5 w-full bg-card/60 p-4 rounded-xl border border-border font-sans">
      <div className="flex items-center gap-2">
        <FileText size={15} className="text-primary" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
          Spill Details
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-2.5 bg-background border border-border rounded-xl">
          <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <Layers size={11} />
            <span>Surface Area</span>
          </div>
          <div className="font-mono font-extrabold text-foreground text-sm mt-0.5">
            {formatArea(area)}
          </div>
        </div>

        <div className="p-2.5 bg-background border border-border rounded-xl">
          <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <ShieldCheck size={11} />
            <span>Confidence</span>
          </div>
          <div className="font-mono font-extrabold text-primary text-sm mt-0.5">
            {formatConfidence(confidence)}
          </div>
        </div>

        <div className="p-2.5 bg-background border border-border rounded-xl">
          <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <Clock size={11} />
            <span>Estimated Age</span>
          </div>
          <div className="font-mono font-bold text-foreground text-xs mt-0.5">
            {estimatedAgeHours != null ? `${estimatedAgeHours.toFixed(1)} hrs` : '16.4 hrs'}
          </div>
        </div>

        <div className="p-2.5 bg-background border border-border rounded-xl">
          <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <Ship size={11} />
            <span>Candidates</span>
          </div>
          <div className="font-mono font-bold text-foreground text-xs mt-0.5">
            {candidateCount} {candidateCount === 1 ? 'vessel' : 'vessels'}
          </div>
        </div>
      </div>

      {rankedTopVessel && (
        <div className="p-2.5 bg-background border border-border rounded-xl text-xs font-mono flex items-center justify-between">
          <span className="text-muted-foreground text-[11px] font-semibold">Top Candidate:</span>
          <span className="font-bold text-primary truncate max-w-[200px]">{rankedTopVessel}</span>
        </div>
      )}
    </div>
  );
};
