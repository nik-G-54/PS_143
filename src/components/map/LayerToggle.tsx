// src/components/map/LayerToggle.tsx
import type { ViewMode } from '../../pages/LiveMapPage';

interface LayerToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  isDark: boolean;
  onThemeToggle: () => void;
  showWind?: boolean;
  onWindToggle?: () => void;
}

export function LayerToggle({ mode, onModeChange, isDark, onThemeToggle, showWind = true, onWindToggle }: LayerToggleProps) {
  const modes: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'heatmap', label: 'Heatmap', icon: '🌡️' },
    { id: 'clusters', label: 'Clusters', icon: '📍' },
    { id: 'markers', label: 'Markers', icon: '🔵' }
  ];

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 flex flex-col gap-1">
        {/* View Mode Buttons */}
        {modes.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                mode === id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }
            `}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}

        {/* Divider */}
        <div className="h-px bg-white/10 my-1" />

        {/* Wind Toggle */}
        {onWindToggle && (
          <button
            onClick={onWindToggle}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                showWind
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }
            `}
          >
            <span>💨</span>
            <span>Wind & Current</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <span>{isDark ? '🌙' : '☀️'}</span>
          <span>{isDark ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </div>
  );
}
