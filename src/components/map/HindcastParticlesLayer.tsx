// src/components/map/HindcastParticlesLayer.tsx
import { PathLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import type { HindcastResult } from '../../types/map';

interface HindcastParticlesLayerProps {
  data: HindcastResult | null;
  visible: boolean;
}

export function createHindcastParticlesLayer({ data, visible }: HindcastParticlesLayerProps) {
  const pathData = data && data.particles && data.particles.length > 0
    ? [{ path: data.particles.map(p => [p.longitude, p.latitude]) }]
    : [];

  return new PathLayer<{ path: number[][] }>({
    id: 'hindcast-particles-layer',
    data: pathData,
    pickable: true,
    visible,
    widthScale: 1,
    widthMinPixels: 2,
    getPath: (d: any) => d.path,
    getColor: [251, 191, 36, 200], // Amber line [251, 191, 36, 200]
    getWidth: 2,
    getDashArray: [6, 4],
    dashJustified: true,
    extensions: [new PathStyleExtension({ dash: true })]
  } as any);
}
