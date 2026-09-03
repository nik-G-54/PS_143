import React from 'react';
import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import { Crosshair } from 'lucide-react';
import { useIncident } from '../../context/IncidentContext';

export const MapPreview: React.FC = () => {
  const { spillDetails, backtrackData } = useIncident();
  
  // Use backend data if available, fallback to some default if loading
  const lat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? spillDetails?.centroid?.lat ?? 0;
  const lng = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? spillDetails?.centroid?.lon ?? 0;
  const name = spillDetails?.location_name || 'MEDITERRANEAN SEA';

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm h-full">
      <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground tracking-wider flex items-center gap-2 font-sans">
          <Crosshair size={14} className="text-primary" />
          {name.toUpperCase()}
        </h3>
      </div>
      
      <div className="flex-1 p-4 flex items-center justify-center relative overflow-hidden bg-background">
        {/* Abstract Map Graphic */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at center, var(--primary) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        <div className="text-center z-10">
          <h4 className="text-foreground text-sm font-semibold tracking-widest mb-1 font-sans">{name.toUpperCase()}</h4>
          <p className="text-muted-foreground text-xs font-sans">2D Map pending backend support</p>
        </div>
      </div>
    </div>
  );
};
