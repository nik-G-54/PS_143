// src/components/map/DeckGLOverlay.tsx
import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { Layer } from '@deck.gl/core';
import { MapboxOverlay } from '@deck.gl/mapbox';

interface DeckGLOverlayProps {
  layers: Layer[];
}

export function DeckGLOverlay({ layers }: DeckGLOverlayProps) {
  const map = useMap();
  const overlayRef = useRef<MapboxOverlay | null>(null);

  useEffect(() => {
    if (!map.current) return;

    const overlay = new MapboxOverlay({
      layers,
      interleaved: true
    });
    overlayRef.current = overlay;

    map.current.addControl(overlay);

    return () => {
      if (overlayRef.current) {
        if (map.current) {
          try {
            map.current.removeControl(overlayRef.current);
          } catch (e) {
            // Ignore if map is already destroyed
          }
        }
        overlayRef.current.finalize();
        overlayRef.current = null;
      }
    };
  }, []);

  // Update layers
  useEffect(() => {
    overlayRef.current?.setProps({ layers });
  }, [layers]);

  return null;
}
