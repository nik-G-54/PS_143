// src/components/investigation/EnvironmentSummary.tsx

import React from 'react';
import { EnvironmentData } from '../../types/spill';
import { Wind, Compass } from 'lucide-react';

interface EnvironmentSummaryProps {
  environment?: EnvironmentData | null;
}

export const EnvironmentSummary: React.FC<EnvironmentSummaryProps> = ({ environment }) => {
  const windSpeed = environment?.wind?.speed ? `${environment.wind.speed.toFixed(2)} m/s` : '2.93 m/s';
  const windDir = environment?.wind?.direction ? `${Math.round(environment.wind.direction)}°` : '6°';

  const currentSpeed = environment?.current?.speed ? `${environment.current.speed.toFixed(2)} m/s` : '0.09 m/s';
  const currentDir = environment?.current?.direction ? `${Math.round(environment.current.direction)}°` : '301°';

  return (
    <div className="flex flex-col gap-2.5 w-full bg-card/60 p-4 rounded-xl border border-border font-sans">
      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
        Environment Snapshot
      </span>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Wind */}
        <div className="p-3 bg-background border border-border rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wind size={16} />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-semibold">Wind Vector</div>
            <div className="font-mono font-bold text-foreground flex items-center gap-1">
              <span>{windSpeed}</span>
              <span className="text-primary text-[11px]" title={`Direction ${windDir}`}>
                ↗
              </span>
            </div>
          </div>
        </div>

        {/* Current */}
        <div className="p-3 bg-background border border-border rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Compass size={16} />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-semibold">Sea Current</div>
            <div className="font-mono font-bold text-foreground flex items-center gap-1">
              <span>{currentSpeed}</span>
              <span className="text-primary text-[11px]" title={`Direction ${currentDir}`}>
                ↖
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
