import React from 'react';
import { mockIncident } from '../../data/mockIncident';
import { Wind, Waves } from 'lucide-react';

export const EnvironmentPanel: React.FC = () => {
  const { environment } = mockIncident;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm">
      <div className="bg-muted/40 px-4 py-2 border-b border-border">
        <h3 className="text-xs font-semibold text-foreground tracking-wider font-sans">ENVIRONMENTAL CONDITIONS</h3>
      </div>
      
      <div className="p-3 grid grid-cols-2 gap-3">
        {/* Wind Card */}
        <div className="bg-muted/30 p-3 rounded border border-border">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Wind size={14} className="text-primary" />
            <span className="text-xs font-medium tracking-wider font-sans">WIND</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-sans">Direction</span>
              <span className="text-foreground font-mono">{environment.wind.direction}°</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-sans">Speed</span>
              <span className="text-foreground font-mono">{environment.wind.speed} kn</span>
            </div>
          </div>
        </div>

        {/* Current Card */}
        <div className="bg-muted/30 p-3 rounded border border-border">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Waves size={14} className="text-primary" />
            <span className="text-xs font-medium tracking-wider font-sans">CURRENT</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-sans">Direction</span>
              <span className="text-foreground font-mono">{environment.current.direction}°</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-sans">Speed</span>
              <span className="text-foreground font-mono">{environment.current.speed} kn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
