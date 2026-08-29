// src/components/map/VesselMarkerLayer.tsx
import { ScatterplotLayer } from '@deck.gl/layers';
import type { VesselTrajectory, AttributionResult } from '../../types/map';

interface VesselMarkerLayerProps {
  trajectories: Record<string, VesselTrajectory>;
  attribution: AttributionResult | null;
  visible: boolean;
}

export function createVesselMarkerLayer({ trajectories, attribution, visible }: VesselMarkerLayerProps) {
  const data = Object.values(trajectories).filter(d => d.points.length > 0);

  const getVesselRank = (vesselId: string) => {
    if (!attribution) return 999;
    const match = attribution.ranked_vessels.find(v => v.vessel_id === vesselId);
    return match ? match.rank : 999;
  };

  return new ScatterplotLayer<VesselTrajectory>({
    id: 'vessel-marker-layer',
    data,
    pickable: true,
    visible,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 6,
    radiusMaxPixels: 15,
    lineWidthMinPixels: 1.5,
    getPosition: (d: VesselTrajectory) => {
      const lastPoint = d.points[d.points.length - 1];
      return [lastPoint.longitude, lastPoint.latitude];
    },
    getRadius: (d: VesselTrajectory) => {
      const rank = getVesselRank(d.vessel_id);
      return rank === 1 ? 200 : 100;
    },
    getFillColor: (d: VesselTrajectory) => {
      const rank = getVesselRank(d.vessel_id);
      return rank === 1
        ? [0, 217, 166, 255]   // Green (#00D9A6)
        : [100, 116, 139, 200]; // Gray (#64748B)
    },
    getLineColor: [255, 255, 255, 255],
    updateTriggers: {
      getFillColor: [attribution],
      getRadius: [attribution]
    }
  });
}
