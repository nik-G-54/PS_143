// src/components/map/layers/PulsingOrigin.ts
import type { Map } from 'maplibre-gl';

const SIZE = 200;

export function addPulsingOrigin(map: Map, id: string, coordinates: [number, number]) {
  removePulsingOrigin(map, id);

  const pulsingDot = {
    width: SIZE,
    height: SIZE,
    data: new Uint8Array(SIZE * SIZE * 4),

    onAdd() {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      (this as any).context = canvas.getContext('2d');
    },

    render() {
      const duration = 1200;
      const t = (performance.now() % duration) / duration;
      const ctx = (this as any).context;
      if (!ctx) return false;
      const w = this.width;
      const h = this.height;
      const coreRadius = w * 0.12;

      ctx.clearRect(0, 0, w, h);

      // Outer pulsing ring
      const ringRadius = coreRadius + (w * 0.35) * t;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.8 * (1 - t)})`;
      ctx.lineWidth = 3 * (1 - t);
      ctx.stroke();

      // Second ring (offset phase)
      const t2 = ((performance.now() + 400) % duration) / duration;
      const ring2 = coreRadius + (w * 0.35) * t2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, ring2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.5 * (1 - t2)})`;
      ctx.lineWidth = 2 * (1 - t2);
      ctx.stroke();

      // Solid core
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner bright dot
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, coreRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      this.data = ctx.getImageData(0, 0, w, h).data;
      map.triggerRepaint();
      return true;
    },
  };

  map.addImage(id, pulsingDot as any, { pixelRatio: 2 });

  // Source + Layer
  const sourceId = `${id}-source`;
  map.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: {},
      }],
    },
  });

  map.addLayer({
    id: `${id}-layer`,
    type: 'symbol',
    source: sourceId,
    layout: {
      'icon-image': id,
      'icon-allow-overlap': true,
    },
  });
}

export function removePulsingOrigin(map: Map, id: string) {
  const layerId = `${id}-layer`;
  const sourceId = `${id}-source`;
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
  if (map.hasImage(id)) map.removeImage(id);
}
