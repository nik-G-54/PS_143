import { Plus, Minus, Layers, Eye, EyeOff } from 'lucide-react';
import { LayerVisibility } from '../../../types/ui';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  theme: 'light' | 'dark';
}

const LAYER_LABELS: Record<keyof LayerVisibility, string> = {
  spills: 'Oil Spills',
  hindcast: 'Drift Path',
  vessels: 'Vessels',
  wind: 'Wind',
};

const LAYER_COLORS: Record<keyof LayerVisibility, string> = {
  spills: '#EF4444',
  hindcast: '#F59E0B',
  vessels: '#00D9A6',
  wind: '#3B82F6',
};

export function MapControls({ onZoomIn, onZoomOut, layers, onToggleLayer, theme }: MapControlsProps) {
  const cardBg = theme === 'dark' ? 'bg-[#1A1D27] border-[#252830]' : 'bg-white border-[#E5E7EB]';

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      {/* Zoom buttons */}
      <div className={`${cardBg} border rounded-lg overflow-hidden shadow-lg`}>
        <button onClick={onZoomIn} className="w-10 h-10 flex items-center justify-center hover:bg-[#F9FAFB] dark:hover:bg-[#252830] transition">
          <Plus size={18} className="text-[#94A3B8]" />
        </button>
        <div className={`h-px ${theme === 'dark' ? 'bg-[#252830]' : 'bg-[#E5E7EB]'}`} />
        <button onClick={onZoomOut} className="w-10 h-10 flex items-center justify-center hover:bg-[#F9FAFB] dark:hover:bg-[#252830] transition">
          <Minus size={18} className="text-[#94A3B8]" />
        </button>
      </div>

      {/* Layer toggles */}
      <div className={`${cardBg} border rounded-lg p-3 shadow-lg`}>
        <div className="flex items-center gap-2 mb-2">
          <Layers size={14} className="text-[#94A3B8]" />
          <span className="text-[11px] uppercase tracking-wide text-[#94A3B8] font-semibold">Layers</span>
        </div>
        {(Object.keys(layers) as (keyof LayerVisibility)[]).map(key => (
          <button
            key={key}
            onClick={() => onToggleLayer(key)}
            className="flex items-center gap-2 w-full py-1.5 px-1 rounded hover:bg-[#F9FAFB] dark:hover:bg-[#252830] transition"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: layers[key] ? LAYER_COLORS[key] : '#64748B' }}
            />
            <span className="text-sm text-[#94A3B8]">{LAYER_LABELS[key]}</span>
            {layers[key]
              ? <Eye size={14} className="ml-auto text-[#94A3B8]" />
              : <EyeOff size={14} className="ml-auto text-[#64748B]" />
            }
          </button>
        ))}
      </div>
    </div>
  );
}
