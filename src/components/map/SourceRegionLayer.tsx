// src/components/map/SourceRegionLayer.tsx
import { PolygonLayer } from '@deck.gl/layers';
import type { HindcastResult } from '../../types/map';

interface SourceRegionLayerProps {
  data: HindcastResult | null;
  visible: boolean;
}

export function createSourceRegionLayer({ data, visible }: SourceRegionLayerProps) {
  return new PolygonLayer<HindcastResult>({
    id: 'source-region-layer',
    data: data ? [data] : [],
    pickable: true,
    stroked: true,
    filled: true,
    visible,
    lineWidthMinPixels: 1.5,
    getPolygon: (d: HindcastResult) => d.source_region.coordinates[0],
    getFillColor: [234, 179, 8, 60],      // Yellow semi-transparent [234, 179, 8, 60]
    getLineColor: [234, 179, 8, 180],     // Yellow line [234, 179, 8, 180]
    getLineWidth: 2
  });
}
