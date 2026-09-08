import { BasemapMode } from '../map/mapConfig';

interface BasemapSelectorProps {
  currentMode: BasemapMode;
  onSelectMode: (mode: BasemapMode) => void;
}

export function BasemapSelector({ currentMode, onSelectMode }: BasemapSelectorProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex bg-card/90 backdrop-blur-md border border-border rounded-lg shadow-md overflow-hidden text-sm font-medium">
      {(['satellite', 'standard'] as BasemapMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onSelectMode(mode)}
          className={`px-4 py-2 capitalize transition-colors ${
            currentMode === mode
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
