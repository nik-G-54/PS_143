import React from 'react';
import { mockIncident } from '../../data/mockIncident';
import { Map as MapIcon } from 'lucide-react';

export const MapPreview: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm h-full">
      <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-wider flex items-center gap-2 font-sans">
          <MapIcon size={14} className="text-primary" />
          2D MAP
        </h3>
        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded uppercase tracking-widest font-mono">Phase 9</span>
      </div>
      
      <div className="flex-1 p-4 flex items-center justify-center relative overflow-hidden bg-background">
        {/* Abstract Map Graphic */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at center, var(--primary) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        <div className="text-center z-10">
          <h4 className="text-foreground text-sm font-semibold tracking-widest mb-1 font-sans">{mockIncident.location.name.toUpperCase()}</h4>
          <p className="text-muted-foreground text-xs font-sans">Map integration coming in Phase 9</p>
        </div>
      </div>
    </div>
  );
};
