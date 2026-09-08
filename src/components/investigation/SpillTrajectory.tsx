// // src/components/investigation/SpillTrajectory.tsx

// import React, { useState, useMemo } from 'react';
// import { TrajectoryPoint } from '../../types/spill';
// import { formatIncidentDate } from '../../utils/dateUtils';
// import { MapPin, Navigation } from 'lucide-react';

// interface SpillTrajectoryProps {
//   trajectory: TrajectoryPoint[];
// }

// export const SpillTrajectory: React.FC<SpillTrajectoryProps> = ({ trajectory }) => {
//   const [selectedIndex, setSelectedIndex] = useState<number>(0);

//   const maxIdx = Math.max(0, trajectory.length - 1);
//   const currentPt = trajectory[Math.min(selectedIndex, maxIdx)] || trajectory[0];

//   const bounds = useMemo(() => {
//     if (trajectory.length === 0) return { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 };
//     const lats = trajectory.map((t) => t.latitude);
//     const lons = trajectory.map((t) => t.longitude);
//     const minLat = Math.min(...lats);
//     const maxLat = Math.max(...lats);
//     const minLon = Math.min(...lons);
//     const maxLon = Math.max(...lons);

//     const latMargin = Math.max((maxLat - minLat) * 0.15, 0.005);
//     const lonMargin = Math.max((maxLon - minLon) * 0.15, 0.005);

//     return {
//       minLat: minLat - latMargin,
//       maxLat: maxLat + latMargin,
//       minLon: minLon - lonMargin,
//       maxLon: maxLon + lonMargin,
//     };
//   }, [trajectory]);

//   const svgWidth = 440;
//   const svgHeight = 160;

//   const pointsSvg = useMemo(() => {
//     if (trajectory.length === 0) return [];
//     return trajectory.map((t) => {
//       const x =
//         ((t.longitude - bounds.minLon) / (bounds.maxLon - bounds.minLon || 1)) *
//         (svgWidth - 40) +
//         20;
//       const y =
//         (1 - (t.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) *
//         (svgHeight - 40) +
//         20;
//       return { x, y, pt: t };
//     });
//   }, [trajectory, bounds, svgWidth, svgHeight]);

//   const pathD = useMemo(() => {
//     if (pointsSvg.length === 0) return '';
//     return pointsSvg.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
//   }, [pointsSvg]);

//   const selectedSvgPt = pointsSvg[Math.min(selectedIndex, pointsSvg.length - 1)];

//   const getHoursAgo = (index: number) => {
//     if (index === 0) return 'NOW';
//     const totalMinutes = index * 15;
//     const hours = Math.round(totalMinutes / 60);
//     return `~${hours}h ago`;
//   };

//   return (
//     <div className="flex flex-col gap-3.5 w-full font-sans bg-card/60 p-4 rounded-xl border border-border">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <Navigation size={15} className="text-primary" />
//           <span className="text-xs font-bold text-foreground uppercase tracking-wider">
//             Estimated Spill Path
//           </span>
//         </div>
//         {currentPt && (
//           <span className="text-[11px] font-mono text-muted-foreground">
//             {formatIncidentDate(currentPt.timestamp)} ·{' '}
//             <span className="text-primary font-bold">{getHoursAgo(selectedIndex)}</span>
//           </span>
//         )}
//       </div>

//       {/* SVG Map Canvas */}
//       <div className="relative w-full h-36 bg-background rounded-lg border border-border overflow-hidden">
//         <div
//           className="absolute inset-0 opacity-20 pointer-events-none"
//           style={{
//             backgroundImage: `radial-gradient(var(--primary) 1px, transparent 1px)`,
//             backgroundSize: '16px 16px',
//           }}
//         />

//         <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
//           {/* Path line */}
//           <path
//             d={pathD}
//             fill="none"
//             stroke="var(--primary)"
//             strokeWidth="2.5"
//             strokeDasharray="4 3"
//             opacity="0.85"
//           />

//           {/* Milestone markers */}
//           {pointsSvg.map((p, i) => {
//             if (i !== 0 && i !== 16 && i !== 32 && i !== 48 && i !== pointsSvg.length - 1) return null;
//             return (
//               <circle
//                 key={i}
//                 cx={p.x}
//                 cy={p.y}
//                 r="3.5"
//                 fill="var(--card)"
//                 stroke="var(--primary)"
//                 strokeWidth="1.5"
//               />
//             );
//           })}

//           {/* Selected Point Highlight */}
//           {selectedSvgPt && (
//             <g>
//               <circle
//                 cx={selectedSvgPt.x}
//                 cy={selectedSvgPt.y}
//                 r="10"
//                 fill="var(--primary)"
//                 opacity="0.3"
//                 className="animate-ping"
//               />
//               <circle
//                 cx={selectedSvgPt.x}
//                 cy={selectedSvgPt.y}
//                 r="5.5"
//                 fill="var(--primary)"
//                 stroke="var(--card)"
//                 strokeWidth="2"
//               />
//             </g>
//           )}
//         </svg>

//         {/* Floating coordinates tag */}
//         {currentPt && (
//           <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground border border-border flex items-center gap-1 font-semibold">
//             <MapPin size={10} className="text-primary" />
//             <span>
//               {currentPt.latitude.toFixed(4)}°N, {currentPt.longitude.toFixed(4)}°E
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Timeline Scrubber */}
//       <div className="flex flex-col gap-1">
//         <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground font-semibold">
//           <span>~16h ago</span>
//           <span>~12h ago</span>
//           <span>~8h ago</span>
//           <span>~4h ago</span>
//           <span className="text-primary font-extrabold">NOW</span>
//         </div>
//         <input
//           type="range"
//           min={0}
//           max={maxIdx}
//           value={selectedIndex}
//           onChange={(e) => setSelectedIndex(Number(e.target.value))}
//           className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
//         />
//       </div>
//     </div>
//   );
// };




// src/components/investigation/SpillTrajectory.tsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { TrajectoryPoint } from '../../types/spill';
import { formatIncidentDate } from '../../utils/dateUtils';
import { useTheme } from '../../hooks/useTheme';
import { MapPin, Navigation } from 'lucide-react';

// CARTO basemap styles (matching maritime-map feature)
const BASEMAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

// Get primary color from CSS variable for map layers
// Convert any CSS color (including oklch) to MapLibre-compatible RGB string
function parseColorToRgb(cssColor: string, fallback = '#3b82f6'): string {
  if (typeof document === 'undefined') return fallback;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallback;
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return fallback;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return fallback;
  }
}

// Get primary color as MapLibre-compatible RGB string from CSS variable
function getPrimaryColor(): string {
  if (typeof window === 'undefined') return '#3b82f6';
  try {
    const el = document.createElement('div');
    el.style.color = 'var(--primary)';
    document.body.appendChild(el);
    const rawColor = window.getComputedStyle(el).color;
    document.body.removeChild(el);
    return parseColorToRgb(rawColor, '#3b82f6');
  } catch {
    return '#3b82f6';
  }
}

interface SpillTrajectoryProps {
  trajectory: TrajectoryPoint[];
}

export const SpillTrajectory: React.FC<SpillTrajectoryProps> = ({ trajectory }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { theme } = useTheme();

  const maxIdx = Math.max(0, trajectory.length - 1);
  const currentPt = trajectory[Math.min(selectedIndex, maxIdx)] || trajectory[0];

  // Reset selectedIndex when trajectory changes so it never exceeds length
  useEffect(() => {
    setSelectedIndex(0);
  }, [trajectory.length]);

  // Build GeoJSON for the full trajectory line
  const trajectoryGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (trajectory.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }
    const lineCoords = trajectory.map((t) => [t.longitude, t.latitude]);
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: lineCoords },
          properties: {},
        },
      ],
    };
  }, [trajectory]);

  // GeoJSON for the selected point
  const selectedPointGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!currentPt) return { type: 'FeatureCollection', features: [] };
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [currentPt.longitude, currentPt.latitude] },
          properties: {},
        },
      ],
    };
  }, [currentPt]);

  // GeoJSON for start marker
  const startPointGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (trajectory.length === 0) return { type: 'FeatureCollection', features: [] };
    const pt = trajectory[0];
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pt.longitude, pt.latitude] },
          properties: { label: 'Origin' },
        },
      ],
    };
  }, [trajectory]);

  // GeoJSON for end marker
  const endPointGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (trajectory.length < 2) return { type: 'FeatureCollection', features: [] };
    const pt = trajectory[trajectory.length - 1];
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pt.longitude, pt.latitude] },
          properties: { label: 'Latest' },
        },
      ],
    };
  }, [trajectory]);

  // Helper: add/update point sources + layers to the map
  const addPointSourcesAndLayers = (map: maplibregl.Map) => {
    const primary = getPrimaryColor();

    // Start marker (Origin -> Blue)
    if (!map.getSource('start-point')) {
      map.addSource('start-point', { type: 'geojson', data: startPointGeoJSON });
    } else {
      (map.getSource('start-point') as maplibregl.GeoJSONSource).setData(startPointGeoJSON);
    }
    if (!map.getLayer('start-marker')) {
      map.addLayer({
        id: 'start-marker',
        type: 'circle',
        source: 'start-point',
        paint: {
          'circle-radius': 6,
          'circle-color': primary,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
    } else {
      try {
        map.setPaintProperty('start-marker', 'circle-color', primary);
      } catch {}
    }

    // End marker (Latest -> Green)
    if (!map.getSource('end-point')) {
      map.addSource('end-point', { type: 'geojson', data: endPointGeoJSON });
    } else {
      (map.getSource('end-point') as maplibregl.GeoJSONSource).setData(endPointGeoJSON);
    }
    if (!map.getLayer('end-marker')) {
      map.addLayer({
        id: 'end-marker',
        type: 'circle',
        source: 'end-point',
        paint: {
          'circle-radius': 6,
          'circle-color': '#22c55e',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
    } else {
      try {
        map.setPaintProperty('end-marker', 'circle-color', '#22c55e');
      } catch {}
    }

    // Selected point (pulsing)
    if (!map.getSource('selected-point')) {
      map.addSource('selected-point', { type: 'geojson', data: selectedPointGeoJSON });
    } else {
      (map.getSource('selected-point') as maplibregl.GeoJSONSource).setData(selectedPointGeoJSON);
    }
    if (!map.getLayer('selected-point-pulse')) {
      map.addLayer({
        id: 'selected-point-pulse',
        type: 'circle',
        source: 'selected-point',
        paint: {
          'circle-radius': 12,
          'circle-color': primary,
          'circle-opacity': 0.3,
        },
      });
    } else {
      try {
        map.setPaintProperty('selected-point-pulse', 'circle-color', primary);
      } catch {}
    }

    if (!map.getLayer('selected-point-inner')) {
      map.addLayer({
        id: 'selected-point-inner',
        type: 'circle',
        source: 'selected-point',
        paint: {
          'circle-radius': 5,
          'circle-color': primary,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
    } else {
      try {
        map.setPaintProperty('selected-point-inner', 'circle-color', primary);
      } catch {}
    }
  };

  // Helper: add/update trajectory line + glow layers
  const addTrajectoryLineLayers = (map: maplibregl.Map) => {
    if (trajectory.length < 2) return;
    const primary = getPrimaryColor();

    if (!map.getSource('trajectory-line')) {
      map.addSource('trajectory-line', { type: 'geojson', data: trajectoryGeoJSON });
    } else {
      (map.getSource('trajectory-line') as maplibregl.GeoJSONSource).setData(trajectoryGeoJSON);
    }

    if (!map.getLayer('trajectory-line-glow')) {
      map.addLayer({
        id: 'trajectory-line-glow',
        type: 'line',
        source: 'trajectory-line',
        paint: {
          'line-color': primary,
          'line-width': 6,
          'line-opacity': 0.25,
        },
      });
    } else {
      try {
        map.setPaintProperty('trajectory-line-glow', 'line-color', primary);
      } catch {}
    }

    if (!map.getLayer('trajectory-line-layer')) {
      map.addLayer({
        id: 'trajectory-line-layer',
        type: 'line',
        source: 'trajectory-line',
        paint: {
          'line-color': primary,
          'line-width': 3,
          'line-opacity': 0.9,
        },
      });
    } else {
      try {
        map.setPaintProperty('trajectory-line-layer', 'line-color', primary);
      } catch {}
    }
  };

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const center: [number, number] =
      trajectory.length > 0
        ? [trajectory[0].longitude, trajectory[0].latitude]
        : [78.0, 12.0]; // Default center (Bay of Bengal)

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES[theme],
      center,
      zoom: trajectory.length > 0 ? 6 : 3,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      interactive: true,
      dragPan: true,
      scrollZoom: true,
      boxZoom: false,
      doubleClickZoom: true,
      touchZoomRotate: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'bottom-right');

    map.on('style.load', () => {
      addPointSourcesAndLayers(map);
      addTrajectoryLineLayers(map);
    });

    map.on('load', () => {
      addPointSourcesAndLayers(map);
      addTrajectoryLineLayers(map);

      // Fit bounds to the trajectory if data exists
      if (trajectory.length > 0) {
        const coords = trajectory.map((t) => [t.longitude, t.latitude] as [number, number]);
        const bounds = new maplibregl.LngLatBounds();
        coords.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, { padding: 40, maxZoom: 10, duration: 0 });
      }

      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update basemap style on theme change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.setStyle(BASEMAP_STYLES[theme]);
  }, [theme, mapLoaded]);

  // Update sources, layers & map bounds when trajectory changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    addPointSourcesAndLayers(map);
    addTrajectoryLineLayers(map);

    if (trajectory.length > 0) {
      const coords = trajectory.map((t) => [t.longitude, t.latitude] as [number, number]);
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, { padding: 40, maxZoom: 10, duration: 300 });
    }
  }, [mapLoaded, trajectoryGeoJSON, startPointGeoJSON, endPointGeoJSON, trajectory]);

  // Update selected point + pulse animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    addPointSourcesAndLayers(map);

    // Animate the pulse
    let frameId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const cycle = (elapsed % 1500) / 1500; // 1.5s cycle
      const radius = 6 + cycle * 10;
      const opacity = 0.4 * (1 - cycle);

      try {
        map.setPaintProperty('selected-point-pulse', 'circle-radius', radius);
        map.setPaintProperty('selected-point-pulse', 'circle-opacity', opacity);
      } catch {
        // Map may have been unmounted
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [mapLoaded, selectedPointGeoJSON]);

  // Fly to selected point
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !currentPt) return;

    map.flyTo({
      center: [currentPt.longitude, currentPt.latitude],
      zoom: Math.max(map.getZoom(), 8),
      duration: 400,
      essential: false,
    });
  }, [selectedIndex, mapLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const getHoursAgo = (index: number) => {
    if (index === 0) return 'NOW';
    const totalMinutes = index * 15;
    const hours = Math.round(totalMinutes / 60);
    return `~${hours}h ago`;
  };

  return (
    <div className="flex flex-col gap-3.5 w-full font-sans bg-card/60 p-4 rounded-xl border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation size={15} className="text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Estimated Spill Path
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-48 rounded-lg border border-border overflow-hidden bg-background">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Map legend */}
        <div className="absolute top-2 left-2 z-10 bg-card/90 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-mono text-muted-foreground border border-border flex items-center gap-3 font-semibold">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Origin
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Latest
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-primary inline-block rounded" /> Path
          </span>
        </div>

        {/* Floating coordinates tag */}
        {currentPt && (
          <div className="absolute bottom-2 left-2 z-10 bg-card/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground border border-border flex items-center gap-1 font-semibold">
            <MapPin size={10} className="text-primary" />
            <span>
              {currentPt.latitude.toFixed(4)}°N, {currentPt.longitude.toFixed(4)}°E
            </span>
          </div>
        )}
      </div>

      {/* Timeline Scrubber */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground font-semibold">
          <span>~16h ago</span>
          <span>~12h ago</span>
          <span>~8h ago</span>
          <span>~4h ago</span>
          <span className="text-primary font-extrabold">NOW</span>
        </div>
        <input
          type="range"
          min={0}
          max={maxIdx}
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
};