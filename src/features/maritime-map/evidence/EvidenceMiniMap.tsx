import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { Maximize2 } from 'lucide-react';
import { MAP_CONFIG } from '../map/mapConfig';
import { useTheme } from '../../../hooks/useTheme';
import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory } from '../types/trajectoryTypes';
import type { AttributedVessel } from '../types/attributionTypes';

/**
 * Minimal 2D situation map for the evidence dossier — its own small MapLibre
 * instance (flat mercator, no globe, no pitch/rotate) with a deck.gl overlay
 * carrying only what the dossier talks about: the drift path, the probable
 * origin and its uncertainty radius, the detection, and the prime candidate
 * with its AIS track. Everything else the full map shows (other detections,
 * time badges, wind particles, forecast) is deliberately left out so the
 * small card stays legible.
 */

const ORIGIN_RGB: [number, number, number] = [78, 154, 110];
const DETECTION_RGB: [number, number, number] = [236, 120, 52];
const DRIFT_RGB: [number, number, number] = [232, 150, 60];
const VESSEL_RGB: [number, number, number] = [217, 158, 58];

interface EvidenceMiniMapProps {
  spill: MapSpill;
  trajectory: SpillTrajectory | null;
  prime: AttributedVessel | null;
  onExpand: () => void;
}

export function EvidenceMiniMap({ spill, trajectory, prime, onExpand }: EvidenceMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [ready, setReady] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const origin = trajectory?.source ?? null;
  const detection = trajectory?.points[trajectory.points.length - 1] ?? { longitude: spill.longitude, latitude: spill.latitude };
  const vesselPos = prime?.culpritLocation ?? null;

  // Frame everything the card shows.
  const bounds = useMemo<[[number, number], [number, number]]>(() => {
    const pts: [number, number][] = [[detection.longitude, detection.latitude]];
    trajectory?.points.forEach((p) => pts.push([p.longitude, p.latitude]));
    if (origin) pts.push([origin.longitude, origin.latitude]);
    if (vesselPos) pts.push([vesselPos.longitude, vesselPos.latitude]);
    const lons = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    return [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
  }, [trajectory, origin, vesselPos, detection.longitude, detection.latitude]);

  // Map lifecycle — one instance per mount; basemap follows the app theme.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_CONFIG.styles.standard[isDark ? 'dark' : 'light'],
      bounds,
      fitBoundsOptions: { padding: 36, maxZoom: 12 },
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
    mapRef.current = map;

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      overlayRef.current = null;
      setReady(false);
      map.remove();
      mapRef.current = null;
    };
    // Recreate only when the theme flips; bounds changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  useEffect(() => {
    mapRef.current?.fitBounds(bounds, { padding: 36, maxZoom: 12, duration: 600 });
  }, [bounds]);

  const layers = useMemo<Layer[]>(() => {
    const out: Layer[] = [];
    const labelColor: [number, number, number, number] = isDark ? [240, 240, 240, 235] : [30, 30, 30, 235];
    const halo: [number, number, number, number] = isDark ? [10, 14, 20, 220] : [255, 255, 255, 230];

    if (origin?.radiusKm) {
      out.push(
        new ScatterplotLayer({
          id: 'mini-origin-radius',
          data: [origin],
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: (d) => (d.radiusKm ?? 0) * 1000,
          radiusUnits: 'meters',
          filled: true,
          stroked: true,
          getFillColor: [...ORIGIN_RGB, 30],
          getLineColor: [...ORIGIN_RGB, 180],
          lineWidthMinPixels: 1,
        })
      );
    }

    if (trajectory && trajectory.points.length > 1) {
      out.push(
        new PathLayer({
          id: 'mini-drift',
          data: [trajectory.points.map((p) => [p.longitude, p.latitude])],
          getPath: (d) => d,
          getColor: [...DRIFT_RGB, 230],
          getWidth: 2.5,
          widthUnits: 'pixels',
          capRounded: true,
          jointRounded: true,
        })
      );
    }

    if (prime && prime.track.length > 1) {
      out.push(
        new PathLayer({
          id: 'mini-vessel-track',
          data: [prime.track.map((p) => [p.longitude, p.latitude])],
          getPath: (d) => d,
          getColor: [...VESSEL_RGB, 170],
          getWidth: 1.5,
          widthUnits: 'pixels',
        })
      );
    }

    const points: { pos: [number, number]; color: [number, number, number]; label: string; r: number }[] = [
      { pos: [detection.longitude, detection.latitude], color: DETECTION_RGB, label: 'Detection', r: 6 },
    ];
    if (origin) points.push({ pos: [origin.longitude, origin.latitude], color: ORIGIN_RGB, label: 'Origin', r: 5 });
    if (vesselPos) points.push({ pos: [vesselPos.longitude, vesselPos.latitude], color: VESSEL_RGB, label: `#1 ${prime?.vesselName ?? ''}`, r: 5 });

    out.push(
      new ScatterplotLayer({
        id: 'mini-points',
        data: points,
        getPosition: (d) => d.pos,
        getRadius: (d) => d.r,
        radiusUnits: 'pixels',
        getFillColor: (d) => [d.color[0], d.color[1], d.color[2], 255] as [number, number, number, number],
        getLineColor: halo,
        stroked: true,
        lineWidthMinPixels: 1.5,
      }),
      new TextLayer({
        id: 'mini-labels',
        data: points,
        getPosition: (d) => d.pos,
        getText: (d) => d.label,
        getSize: 11,
        getColor: labelColor,
        getPixelOffset: [9, 0],
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontWeight: 600,
        outlineWidth: 3,
        outlineColor: halo,
        fontSettings: { sdf: true },
      })
    );
    return out;
  }, [trajectory, origin, prime, vesselPos, detection.longitude, detection.latitude, isDark]);

  useEffect(() => {
    if (ready) overlayRef.current?.setProps({ layers });
  }, [ready, layers]);

  return (
    <div className="maritime-minimap overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Situation map</span>
        </span>
        <button
          type="button"
          onClick={onExpand}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent"
          title="Back to the full map"
        >
          <Maximize2 size={11} />
          Full map
        </button>
      </div>
      <div className="relative h-[220px]">
        <div ref={containerRef} className={`absolute inset-0 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`} />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">Loading map…</div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: `rgb(${DETECTION_RGB})` }} /> Detection
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3" style={{ background: `rgb(${DRIFT_RGB})` }} /> Drift path
        </span>
        {origin && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: `rgb(${ORIGIN_RGB})` }} /> Origin ± radius
          </span>
        )}
        {vesselPos && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: `rgb(${VESSEL_RGB})` }} /> #1 vessel
          </span>
        )}
      </div>
    </div>
  );
}
