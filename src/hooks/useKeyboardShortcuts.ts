// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useRef } from 'react';

interface KeyboardShortcutHandlers {
  onToggleView?: () => void;
  onNextSpill?: () => void;
  onPrevSpill?: () => void;
  onTogglePlayback?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onExportPNG?: () => void;
  onExportGeoJSON?: () => void;
  onToggleHUD?: () => void;
  onEscape?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handlersRef = useRef(handlers);
  
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      const prevent = () => { e.preventDefault(); e.stopPropagation(); };
      const h = handlersRef.current;

      switch (true) {
        // Space — Toggle playback
        case key === ' ':
          prevent();
          h.onTogglePlayback?.();
          break;

        // Arrow keys — Navigate spills
        case key === 'arrowright':
          prevent();
          h.onNextSpill?.();
          break;
        case key === 'arrowleft':
          prevent();
          h.onPrevSpill?.();
          break;

        // + / - — Zoom
        case key === '+' || key === '=':
          prevent();
          h.onZoomIn?.();
          break;
        case key === '-':
          prevent();
          h.onZoomOut?.();
          break;

        // R — Reset view
        case key === 'r' && !ctrl:
          prevent();
          h.onResetView?.();
          break;

        // H — Toggle HUD
        case key === 'h' && !ctrl:
          prevent();
          h.onToggleHUD?.();
          break;

        // V — Toggle view mode
        case key === 'v' && !ctrl:
          prevent();
          h.onToggleView?.();
          break;

        // ? — Show shortcuts help
        case key === '?' || (key === '/' && shift):
          prevent();
          h.onHelp?.();
          break;

        // Ctrl+S — Export PNG
        case key === 's' && ctrl && !shift:
          prevent();
          h.onExportPNG?.();
          break;

        // Ctrl+Shift+S — Export GeoJSON
        case key === 's' && ctrl && shift:
          prevent();
          h.onExportGeoJSON?.();
          break;

        // Escape — Close panel / deselect
        case key === 'escape':
          prevent();
          h.onEscape?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
