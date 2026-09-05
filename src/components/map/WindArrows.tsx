// src/components/map/WindArrows.tsx — FIXED VERSION
import { ScatterplotLayer, TextLayer, IconLayer } from '@deck.gl/layers';
import { useMemo } from 'react';
import type { WindField } from '../../types/wind';

interface WindArrowsProps {
  wind: WindField | null;
  current: WindField | null;
  center: { lon: number; lat: number };
  visible?: boolean;
}

// Arrow SVG icons (create these as data URLs or use a sprite)
const WIND_ARROW_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="28" fill="rgba(34,197,94,0.2)" stroke="rgba(34,197,94,0.8)" stroke-width="2" filter="url(#glow)"/>
  <path d="M32 8 L38 28 L32 24 L26 28 Z" fill="#22c55e" filter="url(#glow)"/>
  <circle cx="32" cy="32" r="4" fill="#22c55e"/>
</svg>`)}`;

const CURRENT_ARROW_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="28" fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.8)" stroke-width="2" filter="url(#glow)"/>
  <path d="M32 8 L38 28 L32 24 L26 28 Z" fill="#06b6d4" filter="url(#glow)"/>
  <circle cx="32" cy="32" r="4" fill="#06b6d4"/>
</svg>`)}`;

export function useWindArrowsLayers(
  wind: WindField | null,
  current: WindField | null,
  center: { lon: number; lat: number } | null,
  visible = true
) {
  return useMemo(() => {
    if (!visible || !center || (!wind && !current)) return [];

    const arrows = [];

    if (wind) {
      arrows.push({
        position: [center.lon - 0.025, center.lat + 0.025] as [number, number],
        angle: wind.direction,
        speed: wind.speed,
        type: 'wind' as const,
        label: `${wind.speed.toFixed(1)} ${wind.unit || 'm/s'}`,
        sublabel: `${wind.direction.toFixed(0)}°`,
      });
    }

    if (current) {
      arrows.push({
        position: [center.lon + 0.025, center.lat - 0.025] as [number, number],
        angle: current.direction,
        speed: current.speed,
        type: 'current' as const,
        label: `${current.speed.toFixed(3)} ${current.unit || 'm/s'}`,
        sublabel: `${current.direction.toFixed(0)}°`,
      });
    }

    if (!arrows.length) return [];

    const glowLayer = new ScatterplotLayer({
      id: 'wind-arrow-glow',
      data: arrows,
      getPosition: (d: any) => d.position,
      getRadius: 800,  // meters — big enough to see
      getFillColor: (d: any) =>
        d.type === 'wind' ? [34, 197, 94, 60] : [6, 182, 212, 60],
      radiusMinPixels: 35,
      radiusMaxPixels: 50,
      stroked: false,
      parameters: { depthTest: false },
    });

    const iconLayer = new IconLayer({
      id: 'wind-arrow-icon',
      data: arrows,
      getIcon: (d: any) => ({
        url: d.type === 'wind' ? WIND_ARROW_SVG : CURRENT_ARROW_SVG,
        width: 64,
        height: 64,
      }),
      getPosition: (d: any) => d.position,
      getSize: 45,  // BIG icon
      sizeMinPixels: 35,
      sizeMaxPixels: 55,
      getAngle: (d: any) => -d.angle,  // Rotate to direction
      billboard: true,
      parameters: { depthTest: false },
    });

    const speedLabelLayer = new TextLayer({
      id: 'wind-speed-label',
      data: arrows,
      getPosition: (d: any) => [
        d.position[0],
        d.position[1] + 0.008, // Offset above the icon
      ],
      getText: (d: any) => d.label,
      getSize: 14,  // MUCH bigger text
      getColor: [255, 255, 255, 255],
      fontFamily: 'Space Grotesk, monospace',
      fontWeight: '800',
      textAnchor: 'middle',
      alignmentBaseline: 'bottom',
      billboard: true,
      parameters: { depthTest: false },
    });

    const dirLabelLayer = new TextLayer({
      id: 'wind-dir-label',
      data: arrows,
      getPosition: (d: any) => [
        d.position[0],
        d.position[1] - 0.008, // Below icon
      ],
      getText: (d: any) => `${d.type === 'wind' ? '💨 WIND' : '🌊 CURRENT'} ${d.sublabel}`,
      getSize: 10,
      getColor: (d: any) =>
        d.type === 'wind' ? [34, 197, 94, 255] : [6, 182, 212, 255],
      fontFamily: 'Space Grotesk, monospace',
      fontWeight: '600',
      textAnchor: 'middle',
      alignmentBaseline: 'top',
      billboard: true,
      parameters: { depthTest: false },
    });

    return [glowLayer, iconLayer, speedLabelLayer, dirLabelLayer];
  }, [wind, current, center, visible]);
}

export function WindArrows({ wind, current, center, visible = true }: WindArrowsProps) {
  // Return null because layers are handled by useWindArrowsLayers in DeckGLOverlay
  return null;
}
