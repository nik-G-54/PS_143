// src/components/map/SpillLayer.tsx
import { PolygonLayer } from '@deck.gl/layers';
import type { SpillEvent } from '../../types/map';

interface SpillLayerProps {
  data: SpillEvent[];
  selectedSpillId: string | null;
  onClick: (spill: SpillEvent) => void;
  visible?: boolean;
}

export function createSpillLayer({ data, selectedSpillId, onClick, visible = true }: SpillLayerProps) {
  return new PolygonLayer<SpillEvent>({
    id: 'spill-layer',
    data,
    pickable: true,
    stroked: true,
    filled: true,
    visible,
    lineWidthMinPixels: 2,
    getPolygon: (d: SpillEvent) => d.polygon.coordinates[0],
    getFillColor: (d: SpillEvent) =>
      d.spill_id === selectedSpillId
        ? [220, 38, 38, 200]  // Highlighted: Spill Crimson (#DC2626)
        : [220, 38, 38, 130], // Standard: Spill Crimson (#DC2626)
    getLineColor: [255, 255, 255, 200], // White outline
    getLineWidth: 2,
    onClick: (info) => {
      if (info.object) {
        onClick(info.object);
      }
    },
    updateTriggers: {
      getFillColor: [selectedSpillId]
    }
  });
}
