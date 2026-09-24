import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { Maximize2, Minimize2 } from 'lucide-react';
import { MAP_CONFIG } from './mapConfig';
import type { BasemapMode, MapTheme } from './mapConfig';
import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory } from '../types/trajectoryTypes';
import { getSpillBounds } from '../adapters/spillAdapter';

/**
 * Regional 2D inset over the globe: a flat (mercator) map of the detection
 * region, pinned top-left, in the same basemap and theme as the globe. It is
 * a separate MapLibre instance with its own deck.gl overlay, carrying only
 * the detections (and the selected spill's drift path) so it reads at a
 * glance.
 *
 * Fully interactive while small: pan and zoom as usual, click a detection to
 * select it. A click on empty map (or the expand button) grows it into a
 * full-size 2D view over the globe; the collapse button shrinks it back.
 * The grow/shrink animates the card's inset while the canvas follows every
 * frame (a small map, so the per-frame resize is cheap).
 */

const SPILL_RGB: [number, number, number] = [236, 120, 52];
const SELECTED_RGB: [number, number, number] = [250, 204, 21];
const DRIFT_RGB: [number, number, number] = [232, 150, 60];

interface RegionInsetMapProps {
  spills: MapSpill[];
  selectedSpill: MapSpill | null;
  trajectory: SpillTrajectory | null;
  basemapMode: BasemapMode;
  theme: MapTheme;
  onSelectSpill: (spillId: string) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export function RegionInsetMap({
  spills,
  selectedSpill,
  trajectory,
  basemapMode,
  theme,
  onSelectSpill,
  expanded,
  onExpandedChange,
}: RegionInsetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [ready, setReady] = useState(false);
  const styleKeyRef = useRef(`${basemapMode}:${theme}`);
  // Latest callbacks for the map's own click handler, registered once.
  const handlersRef = useRef({ onSelectSpill, onExpandedChange, expanded });
  handlersRef.current = { onSelectSpill, onExpandedChange, expanded };

  const regionBounds = useMemo(() => getSpillBounds(spills), [spills]);

  // Map lifecycle.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_CONFIG.styles[basemapMode][theme],
      center: [MAP_CONFIG.initialCamera.longitude, MAP_CONFIG.initialCamera.latitude],
      zoom: 4,
      attributionControl: false,
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
      maxPitch: 0,
    });
    map.touchZoomRotate.disableRotation();

    map.on('load', () => {
      const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
      overlayRef.current = overlay;
      map.addControl(overlay as unknown as maplibregl.IControl);
      setReady(true);
    });

    // One click handler for both behaviours: a detection under the cursor
    // selects it; empty map expands the collapsed inset.
    map.on('click', (event) => {
      const picked = overlayRef.current?.pickObject({ x: event.point.x, y: event.point.y, radius: 4 });
      const spill = picked?.object as MapSpill | undefined;
      if (spill?.spillId) {
        handlersRef.current.onSelectSpill(spill.spillId);
        return;
      }
      if (!handlersRef.current.expanded) handlersRef.current.onExpandedChange(true);
    });

    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (frame != null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        map.resize();
      });
    });
    observer.observe(containerRef.current);
    mapRef.current = map;

    return () => {
      observer.disconnect();
      if (frame != null) cancelAnimationFrame(frame);
      overlayRef.current = null;
      setReady(false);
      map.remove();
      mapRef.current = null;
    };
    // Created once; basemap/theme changes restyle it below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap / theme follow the globe.
  useEffect(() => {
    const map = mapRef.current;
    const key = `${basemapMode}:${theme}`;
    if (!map || !ready || styleKeyRef.current === key) return;
    styleKeyRef.current = key;
    map.setStyle(MAP_CONFIG.styles[basemapMode][theme], { diff: false });
  }, [basemapMode, theme, ready]);

  // Frame the region on load, then follow the selection.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (trajectory && trajectory.points.length > 1) {
      const b = trajectory.bounds;
      map.fitBounds(
        [
          [b.minLon, b.minLat],
          [b.maxLon, b.maxLat],
        ],
        { padding: 40, maxZoom: 11, duration: 800 }
      );
    } else if (selectedSpill) {
      map.flyTo({ center: [selectedSpill.longitude, selectedSpill.latitude], zoom: Math.max(map.getZoom(), 8), duration: 800 });
    } else if (regionBounds) {
      map.fitBounds(
        [
          [regionBounds.minLon, regionBounds.minLat],
          [regionBounds.maxLon, regionBounds.maxLat],
        ],
        { padding: 24, maxZoom: 9, duration: 0 }
      );
    }
  }, [ready, selectedSpill?.spillId, trajectory, regionBounds]); // eslint-disable-line react-hooks/exhaustive-deps

  const layers = useMemo<Layer[]>(() => {
    const out: Layer[] = [];
    if (trajectory && trajectory.points.length > 1) {
      out.push(
        new PathLayer({
          id: 'inset-drift',
          data: [trajectory.points.map((p) => [p.longitude, p.latitude])],
          getPath: (d) => d,
          getColor: [...DRIFT_RGB, 230],
          getWidth: 2,
          widthUnits: 'pixels',
          capRounded: true,
          jointRounded: true,
        })
      );
    }
    out.push(
      new ScatterplotLayer<MapSpill>({
        id: 'inset-spills',
        data: spills,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: (d) => (d.spillId === selectedSpill?.spillId ? 7 : 2.5 + Math.min(4, Math.sqrt(d.areaKm2 ?? 0))),
        radiusUnits: 'pixels',
        getFillColor: (d) =>
          d.spillId === selectedSpill?.spillId
            ? [SELECTED_RGB[0], SELECTED_RGB[1], SELECTED_RGB[2], 255]
            : [SPILL_RGB[0], SPILL_RGB[1], SPILL_RGB[2], 200],
        getLineColor: [255, 255, 255, 230],
        stroked: true,
        lineWidthMinPixels: 1,
        getLineWidth: (d) => (d.spillId === selectedSpill?.spillId ? 2 : 0.5),
        pickable: true,
        updateTriggers: {
          getRadius: [selectedSpill?.spillId],
          getFillColor: [selectedSpill?.spillId],
          getLineWidth: [selectedSpill?.spillId],
        },
      })
    );
    return out;
  }, [spills, selectedSpill?.spillId, trajectory]);

  useEffect(() => {
    if (ready) overlayRef.current?.setProps({ layers });
  }, [ready, layers]);

  return (
    <div className={`maritime-region-inset ${expanded ? 'is-expanded' : ''}`}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-2.5 py-1.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Regional view · 2D
          </span>
          {expanded && (
            <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
              {spills.length} detections{selectedSpill ? ` · ${selectedSpill.spillId}` : ''}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-foreground transition-colors hover:bg-accent"
          title={expanded ? 'Back to the globe' : 'Open the 2D map'}
        >
          {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          {expanded ? 'Globe' : 'Expand'}
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className={`absolute inset-0 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </div>
  );
}
