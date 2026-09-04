import { useRef, useEffect, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { MAP_CONFIG, BasemapMode } from './mapConfig';
import { useTheme } from '../../../hooks/useTheme';
import { BasemapSelector } from '../controls/BasemapSelector';

// Explicitly set the worker URL using Vite's ?worker&url syntax
// This fixes the 'maplibre-gl-worker.mjs does not exist in optimize deps' error
maplibregl.setWorkerUrl(workerUrl);


export function MaritimeMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { theme } = useTheme();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [basemapMode, setBasemapMode] = useState<BasemapMode>('standard');
  const [isStyleLoading, setIsStyleLoading] = useState(false);

  // Helper: apply globe projection to a map instance.
  // Must be called AFTER the style has finished loading (inside style.load).
  // This is the pattern used by the official MapLibre globe examples.
  const applyGlobeProjection = (map: maplibregl.Map) => {
    try {
      (map as any).setProjection({ type: 'globe' });
    } catch (err) {
      console.warn('Globe projection not available:', err);
    }
  };

  // --- Map initialization (runs once) ---
  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;

    try {
      const initialStyle = MAP_CONFIG.styles[basemapMode][theme];

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: [MAP_CONFIG.initialCamera.longitude, MAP_CONFIG.initialCamera.latitude],
        zoom: MAP_CONFIG.initialCamera.zoom,
        pitch: MAP_CONFIG.initialCamera.pitch,
        bearing: MAP_CONFIG.initialCamera.bearing,
        attributionControl: false,
        renderWorldCopies: false,
      });

      // Globe projection MUST be applied after style.load — this is the
      // official MapLibre pattern from their own globe examples.
      map.on('style.load', () => {
        applyGlobeProjection(map);
      });

      map.on('load', () => {
        setIsLoading(false);
      });

      // Navigation controls
      map.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true,
        }),
        'bottom-right'
      );

      // Fullscreen
      map.addControl(new maplibregl.FullscreenControl(), 'bottom-right');

      // Attribution
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-left'
      );

      map.on('error', (e) => {
        console.error('MapLibre error:', e);
        if (e.error && e.error.message) {
          setError('Map could not be loaded.');
          setIsLoading(false);
          setIsStyleLoading(false);
        }
      });

      mapRef.current = map;
    } catch (e) {
      console.error('Failed to initialize MapLibre:', e);
      setError('Map could not be loaded.');
      setIsLoading(false);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Style switching (theme or basemap change) ---
  // setStyle() resets everything including projection.
  // The 'style.load' handler registered above fires after EVERY style load,
  // so globe projection is automatically re-applied.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isLoading) return;

    setIsStyleLoading(true);
    const newStyle = MAP_CONFIG.styles[basemapMode][theme];
    map.setStyle(newStyle);

    // Clear loading indicator once style data arrives.
    const onStyleData = () => {
      if (map.isStyleLoaded()) {
        setIsStyleLoading(false);
        map.off('styledata', onStyleData);
      }
    };
    map.on('styledata', onStyleData);
  }, [theme, basemapMode, isLoading]);

  return (
    <div className="maritime-map-wrapper h-full w-full relative">
      <BasemapSelector currentMode={basemapMode} onSelectMode={setBasemapMode} />

      {(isLoading || isStyleLoading) && !error && (
        <div className="maritime-map-loading">
          <span>{isLoading ? 'Loading maritime map…' : 'Loading imagery…'}</span>
        </div>
      )}

      {error && (
        <div className="maritime-map-error">
          <span>{error}</span>
        </div>
      )}

      <div
        ref={mapContainerRef}
        className="maritime-map-container"
      />
    </div>
  );
}
