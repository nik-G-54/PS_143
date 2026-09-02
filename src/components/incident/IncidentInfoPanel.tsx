import React from 'react';
import { mockIncident } from '../../data/mockIncident';
import { AlertCircle, Ship } from 'lucide-react';

export const IncidentInfoPanel: React.FC = () => {
  const { id, status, detectedAt, location, confidence, vessel } = mockIncident;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm">
      <div className="bg-muted/40 px-4 py-3 border-b border-border flex items-center gap-2">
        <AlertCircle size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground tracking-wider font-sans">INCIDENT DETAILS</h3>
      </div>
      
      <div className="p-4 space-y-4 text-sm flex-1 overflow-y-auto">
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground font-medium text-xs tracking-wider font-sans">INCIDENT</span>
          <span className="text-primary font-mono font-bold">{id}</span>
        </div>
        
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground font-medium text-xs tracking-wider font-sans">STATUS</span>
          <span className="text-destructive font-bold text-xs tracking-wider font-sans">{status}</span>
        </div>
        
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground font-medium text-xs tracking-wider font-sans">DETECTED</span>
          <div className="text-right">
            <div className="text-foreground font-mono">{detectedAt.split(' ')[0]} {detectedAt.split(' ')[1]} {detectedAt.split(' ')[2]}</div>
            <div className="text-muted-foreground font-mono text-xs">{detectedAt.split(' ')[3]} {detectedAt.split(' ')[4]}</div>
          </div>
        </div>
        
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground font-medium text-xs tracking-wider font-sans">LOCATION</span>
          <span className="text-foreground font-sans">{location.name}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 border-b border-border pb-2">
          <div>
            <span className="block text-muted-foreground text-[10px] tracking-wider mb-1 font-sans">LATITUDE</span>
            <span className="text-foreground font-mono text-xs bg-muted/50 px-2 py-1 rounded">{location.lat}° N</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-[10px] tracking-wider mb-1 font-sans">LONGITUDE</span>
            <span className="text-foreground font-mono text-xs bg-muted/50 px-2 py-1 rounded">{location.lng}° E</span>
          </div>
        </div>
        
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground font-medium text-xs tracking-wider font-sans">CONFIDENCE</span>
          <span className="text-primary font-mono font-bold">{confidence}%</span>
        </div>

        <div className="mt-4 pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Ship size={14} className="text-primary" />
            <span className="text-muted-foreground font-semibold text-xs tracking-wider font-sans">SUSPECTED VESSEL</span>
          </div>
          <div className="bg-muted/30 p-3 rounded border border-border space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs font-sans">NAME</span>
              <span className="text-foreground font-medium text-xs font-sans">{vessel.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs font-sans">TYPE</span>
              <span className="text-foreground text-xs font-sans">{vessel.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs font-sans">IMO</span>
              <span className="text-primary font-mono text-xs">{vessel.imo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
