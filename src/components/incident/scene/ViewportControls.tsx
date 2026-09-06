import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Droplets,
  Ship,
  Wind,
  Waves,
  Sun,
  Moon,
  Grid3X3,
  Sparkles,
} from 'lucide-react';
import { SceneLayerKey, useSceneLayers } from '../../../context/SceneLayersContext';

const QUICK_TOGGLES: {
  key: SceneLayerKey;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}[] = [
  {
    key: 'ais',
    label: 'Vessels',
    icon: <Ship size={12} />,
    activeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
  },
  {
    key: 'oil',
    label: 'Oil Spill',
    icon: <Droplets size={12} />,
    activeClass: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
  },
  {
    key: 'wind',
    label: 'Wind',
    icon: <Wind size={12} />,
    activeClass: 'bg-yellow-500/20 text-yellow-100 border-yellow-400/40',
  },
  {
    key: 'current',
    label: 'Current',
    icon: <Waves size={12} />,
    activeClass: 'bg-sky-500/20 text-sky-100 border-sky-400/40',
  },
];

const EXTRA_LAYERS: { key: SceneLayerKey; label: string }[] = [
  { key: 'source', label: 'Source estimate' },
  { key: 'grid', label: 'Grid' },
  { key: 'lite', label: 'Lite water' },
];

export const ViewportControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { layers, toggleLayer } = useSceneLayers();

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pointer-events-auto max-w-[calc(100%-2rem)]">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-lg">
        {QUICK_TOGGLES.map((item) => {
          const on = layers[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleLayer(item.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-semibold tracking-wider uppercase border transition-colors ${
                on
                  ? item.activeClass
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}

        <div className="w-px h-5 bg-white/10 mx-0.5" />

        <button
          type="button"
          onClick={() => toggleLayer('night')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-semibold tracking-wider uppercase border transition-colors ${
            layers.night
              ? 'bg-indigo-500/25 text-indigo-100 border-indigo-400/40'
              : 'bg-amber-500/15 text-amber-100 border-amber-400/35'
          }`}
          title={layers.night ? 'Switch to day' : 'Switch to night'}
        >
          {layers.night ? <Moon size={12} /> : <Sun size={12} />}
          <span className="hidden md:inline">{layers.night ? 'Night' : 'Day'}</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold tracking-wider uppercase text-slate-300 hover:bg-white/5 border border-transparent"
          >
            <Layers size={12} />
            {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {isOpen && (
            <div className="absolute top-full right-0 mt-2 w-44 bg-slate-950/95 border border-white/10 rounded-lg shadow-xl backdrop-blur-md overflow-hidden">
              {EXTRA_LAYERS.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={layers[item.key]}
                    onChange={() => toggleLayer(item.key)}
                    className="w-3 h-3 accent-primary cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-200 flex items-center gap-1.5">
                    {item.key === 'grid' ? <Grid3X3 size={11} /> : <Sparkles size={11} />}
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
