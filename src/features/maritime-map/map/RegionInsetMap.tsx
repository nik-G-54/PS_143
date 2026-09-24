import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { Maximize2, Minimize2 } from 'lucide-react';
import { MAP_CONFIG } from './mapConfig';
import type { BasemapMode, MapTheme } from './mapConfig';
import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory } from '../types/trajectoryTypes';

/**
 * Regional 2D inset over the globe: a flat (mercator) map of the detection
 * region, pinned in the map's top-left corner, in the same basemap and theme
 * as the globe. A separate MapLibre instance with its own deck.gl overlay.
 *
 * The region is marked, not listed: an outline around every detection (the
 * convex hull, buffered so edge detections sit inside it) with a location pin
 * at its centre. Individual detections are small dots within it, and the
 * selected spill (plus its drift path) is highlighted.
 *
 * Fully interactive while small: pan/zoom, click a detection to select it,
 * click empty map (or the expand icon) to grow it into a full-size 2D view.
 */

const SPILL_RGB: [number, number, number] = [236, 120, 52];
const SELECTED_RGB: [number, number, number] = [250, 204, 21];
const DRIFT_RGB: [number, number, number] = [232, 150, 60];
const REGION_RGB: [number, number, number] = [245, 158, 11];
/** Margin around the outermost detections, so the outline doesn't cut through them. */
const REGION_BUFFER_KM = 12;

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
  const pinRef = useRef<maplibregl.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const styleKeyRef = useRef(`${basemapMode}:${theme}`);
  const handlersRef = useRef({ onSelectSpill, onExpandedChange, expanded });
  handlersRef.current = { onSelectSpill, onExpandedChange, expanded };

  // Detection region: buffered convex hull of every detection, its centre and extent.
  const region = useMemo(() => {
    const points = spills.map((s) => turf.point([s.longitude, s.latitude]));
    if (points.length === 0) return null;
    const collection = turf.featureCollection(points);
    const hull = points.length >= 3 ? turf.convex(collection) : null;
    const base = hull ?? turf.bboxPolygon(turf.bbox(collection));
    const outline = turf.buffer(base, REGION_BUFFER_KM, { units: 'kilometers' }) ?? base;
    const [minLon, minLat, maxLon, maxLat] = turf.bbox(outline);
    const centre = turf.centroid(base).geometry.coordinates as [number, number];
    const ring = (outline.geometry.type === 'Polygon'
      ? outline.geometry.coordinates[0]
      : outline.geometry.coordinates[0][0]) as [number, number][];
    return { ring, centre, bounds: [[minLon, minLat], [maxLon, maxLat]] as [[number, number], [number, number]] };
  }, [spills]);

  // Collapsed: a continental overview centred on the region, so the pin
  // reads as "here, in the world" at a glance. Expanded: zoom in to the
  // region's own outline.
  const frameRegion = (duration = 600, isExpanded = handlersRef.current.expanded) => {
    const map = mapRef.current;
    if (!map || !region) return;
    map.resize();
    if (isExpanded) {
      map.fitBounds(region.bounds, { padding: 48, maxZoom: 10, duration });
      return;
    }
    // Zoom at which ~210° of longitude spans the card (MapLibre's world is 512px wide at zoom 0).
    const overviewZoom = Math.max(0, Math.log2((map.getContainer().clientWidth * 1.7) / 512));
    map.easeTo({ center: region.centre, zoom: overviewZoom, duration });
  };

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

    // A detection under the cursor selects it; empty map expands the collapsed inset.
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
      pinRef.current?.remove();
      pinRef.current = null;
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

  // Location pin at the region's centre + initial framing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !region) return;
    pinRef.current?.remove();
    const pin = new maplibregl.Marker({ color: '#ef4444', scale: 0.75 }).setLngLat(region.centre).addTo(map);
    pin.getElement().title = `Detection region · ${spills.length} detections`;
    pinRef.current = pin;
    frameRegion(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, region]);

  const layers = useMemo<Layer[]>(() => {
    const out: Layer[] = [];
    if (region) {
      out.push(
        new PolygonLayer({
          id: 'inset-region',
          data: [region.ring],
          getPolygon: (d) => d,
          filled: true,
          stroked: true,
          getFillColor: [...REGION_RGB, 26],
          getLineColor: [...REGION_RGB, 220],
          lineWidthUnits: 'pixels',
          getLineWidth: 1.5,
          pickable: false,
        })
      );
    }
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
        getRadius: (d) => (d.spillId === selectedSpill?.spillId ? 5 : 2),
        radiusUnits: 'pixels',
        getFillColor: (d) =>
          d.spillId === selectedSpill?.spillId
            ? [SELECTED_RGB[0], SELECTED_RGB[1], SELECTED_RGB[2], 255]
            : [SPILL_RGB[0], SPILL_RGB[1], SPILL_RGB[2], 190],
        getLineColor: [255, 255, 255, 230],
        stroked: true,
        lineWidthMinPixels: 0.5,
        getLineWidth: (d) => (d.spillId === selectedSpill?.spillId ? 1.5 : 0),
        pickable: true,
        updateTriggers: {
          getRadius: [selectedSpill?.spillId],
          getFillColor: [selectedSpill?.spillId],
          getLineWidth: [selectedSpill?.spillId],
        },
      })
    );
    return out;
  }, [spills, selectedSpill?.spillId, trajectory, region]);

  useEffect(() => {
    if (ready) overlayRef.current?.setProps({ layers });
  }, [ready, layers]);

  return (
    <div
      className={`maritime-region-inset ${expanded ? 'is-expanded' : ''}`}
      // Re-frame the region once the grow/shrink settles at its new size.
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === 'width') frameRegion();
      }}
    >
      <div ref={containerRef} className={`absolute inset-0 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`} />
      <button
        type="button"
        onClick={() => onExpandedChange(!expanded)}
        className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-md transition-colors hover:bg-accent"
        title={expanded ? 'Back to the globe' : 'Open the regional 2D map'}
        aria-label={expanded ? 'Back to the globe' : 'Open the regional 2D map'}
      >
        {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </div>
  );
}
