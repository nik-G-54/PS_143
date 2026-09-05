// src/components/map/overlays/ShortcutsHelp.tsx
import { useState, useEffect } from 'react';

const SHORTCUTS = [
  { keys: ['Space'], action: 'Play / Pause timeline' },
  { keys: ['←', '→'], action: 'Previous / Next spill' },
  { keys: ['+', '-'], action: 'Zoom in / out' },
  { keys: ['R'], action: 'Reset map view' },
  { keys: ['H'], action: 'Toggle HUD panels' },
  { keys: ['V'], action: 'Toggle view mode' },
  { keys: ['Ctrl', 'S'], action: 'Export map as PNG' },
  { keys: ['Ctrl', 'Shift', 'S'], action: 'Export as GeoJSON' },
  { keys: ['Esc'], action: 'Close panel / Deselect' },
  { keys: ['?'], action: 'Show this help' },
];

interface ShortcutsHelpProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ShortcutsHelp({ isOpen: externalIsOpen, onClose }: ShortcutsHelpProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    setInternalIsOpen(open);
    if (!open && onClose) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          absolute bottom-4 left-4 z-20
          w-10 h-10 
          bg-slate-900/95 border border-slate-700
          rounded-full 
          flex items-center justify-center
          text-white text-lg font-bold
          hover:bg-slate-800 transition-colors shadow-lg cursor-pointer
        "
        title="Keyboard shortcuts (?)"
      >
        ?
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Content */}
          <div className="
            relative z-10
            bg-slate-900/95 border border-slate-700
            rounded-2xl 
            p-6 
            max-w-md w-full mx-4
            shadow-2xl
          ">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {SHORTCUTS.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{shortcut.action}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="
                          px-2 py-1 
                          bg-slate-800 
                          border border-slate-600 
                          rounded 
                          text-white text-xs 
                          font-mono
                          min-w-[28px] text-center
                        "
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-slate-500 text-xs text-center font-mono">
                Press <kbd className="px-1 bg-slate-800 rounded">?</kbd> to toggle this panel
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
