import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { SceneLayerKey, useSceneLayers } from '../../../context/SceneLayersContext';

const LAYER_LABELS: Record<SceneLayerKey, string> = {
  oil: 'Oil',
  source: 'Source',
  ais: 'AIS',
  wind: 'Wind',
  current: 'Current',
  grid: 'Grid',
  lite: 'Lite water',
};

const LAYER_ORDER: SceneLayerKey[] = ['oil', 'source', 'ais', 'wind', 'current', 'grid', 'lite'];

export const ViewportControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { layers, toggleLayer } = useSceneLayers();

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
        <div className="mt-2 w-44 bg-card/90 border border-border rounded shadow-xl backdrop-blur-md overflow-hidden flex flex-col">
          {LAYER_ORDER.map((key) => (
            <label
              key={key}
              className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0 transition-colors"
            >
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => toggleLayer(key)}
                className="w-3 h-3 accent-primary rounded-sm bg-muted border-border cursor-pointer"
              />
              <span className="text-xs font-sans text-foreground uppercase tracking-wider">
                {LAYER_LABELS[key]}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
