import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

export const ViewportControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [layers, setLayers] = useState({
    oil: true,
    source: true,
    ais: true,
    wind: true,
    current: true,
    grid: false
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
    // Ideally, these would dispatch to a context to toggle 3D visibility
  };

  return (
    <div className="absolute top-4 left-4 z-30">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 bg-card/80 hover:bg-card border border-border backdrop-blur-md rounded shadow-lg transition-colors text-foreground text-xs font-semibold tracking-wider"
      >
        <Layers size={14} className="text-primary" />
        LAYERS
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <div className="mt-2 w-40 bg-card/90 border border-border rounded shadow-xl backdrop-blur-md overflow-hidden flex flex-col">
          {(Object.keys(layers) as Array<keyof typeof layers>).map((key) => (
            <label key={key} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0 transition-colors">
              <input 
                type="checkbox" 
                checked={layers[key]} 
                onChange={() => toggleLayer(key)}
                className="w-3 h-3 accent-primary rounded-sm bg-muted border-border cursor-pointer" 
              />
              <span className="text-xs font-sans text-foreground uppercase tracking-wider">{key}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
