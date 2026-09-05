// src/hooks/useEnvironmentLayers.ts
import { useMemo } from 'react';
import { IconLayer } from '@deck.gl/layers';
import type { VisualizationData } from '../types/detail';

function windArrow(data: VisualizationData) {
  if (!data.environment?.wind) return [];
  const { speed, direction } = data.environment.wind;
  // Convert direction (meteorological) to radians
  const rad = ((direction - 180) * Math.PI) / 180;
  return [
    [data.spill.longitude, data.spill.latitude, speed, rad, 'wind'],
  ];
}

function currentArrow(data: VisualizationData) {
  if (!data.environment?.current) return [];
  const { speed, direction } = data.environment.current;
  const rad = ((direction - 180) * Math.PI) / 180;
  const lon = data.source_estimate?.longitude ?? data.spill.longitude;
  const lat = data.source_estimate?.latitude ?? data.spill.latitude;
  return [
    [lon, lat, speed, rad, 'current'],
  ];
}

export function useEnvironmentLayers(viz: VisualizationData | null) {
  return useMemo(() => {
    if (!viz || !viz.environment) return [];

    const windData = windArrow(viz);
    const currentData = currentArrow(viz);

    const windLayer = new IconLayer({
      id: 'wind-arrows',
      data: windData,
      getIcon: () => ({
        url: createArrowSVG('#22c55e'),
        width: 64,
        height: 64,
      }),
      getSize: 30,
      getPosition: (d: any) => [d[0], d[1]],
      getAngle: (d: any) => (d[3] * 180) / Math.PI,
      sizeScale: 1,
    });

    const currentLayer = new IconLayer({
      id: 'current-arrows',
      data: currentData,
      getIcon: () => ({
        url: createArrowSVG('#06b6d4'),
        width: 64,
        height: 64,
      }),
      getSize: 35,
      getPosition: (d: any) => [d[0], d[1]],
      getAngle: (d: any) => (d[3] * 180) / Math.PI,
      sizeScale: 1,
    });

    return [windLayer, currentLayer];
  }, [viz]);
}

// Generate arrow SVG as data URL
function createArrowSVG(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <defs>
      <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <path d="M32 4 L40 24 L36 24 L36 56 L28 56 L28 24 L24 24 Z" 
          fill="${color}" opacity="0.9" filter="url(#glow)"/>
    <circle cx="32" cy="4" r="3" fill="${color}"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
