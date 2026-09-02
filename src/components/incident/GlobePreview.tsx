import React from 'react';
import { Globe } from 'lucide-react';

export const GlobePreview: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm h-full">
      <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-wider flex items-center gap-2 font-sans">
          <Globe size={14} className="text-primary" />
          GLOBE
        </h3>
        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded uppercase tracking-widest font-mono">Phase 9</span>
      </div>
      
      <div className="flex-1 p-4 flex items-center justify-center relative overflow-hidden bg-background">
        <div className="w-24 h-24 rounded-full border border-primary/30 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border border-primary/10 scale-110" />
          <Globe size={32} className="text-primary/50" />
        </div>
        <div className="absolute bottom-4 text-center z-10 w-full">
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-mono">Globe integration pending</p>
        </div>
      </div>
    </div>
  );
};
