// src/components/map/VesselTrackLayer.tsx
import { PathLayer } from '@deck.gl/layers';
import type { VesselTrajectory, AttributionResult } from '../../types/map';

interface VesselTrackLayerProps {
  trajectories: Record<string, VesselTrajectory>;
  attribution: AttributionResult | null;
  visible: boolean;
}

export function createVesselTrackLayer({ trajectories, attribution, visible }: VesselTrackLayerProps) {
  const data = Object.values(trajectories);

  const getVesselRank = (vesselId: string) => {
    if (!attribution) return 999;
    const match = attribution.ranked_vessels.find(v => v.vessel_id === vesselId);
    return match ? match.rank : 999;
  };

  return new PathLayer<VesselTrajectory>({
    id: 'vessel-track-layer',
    data,
    pickable: true,
    visible,
    widthScale: 1,
    widthMinPixels: 2,
    getPath: (d: VesselTrajectory) => d.points.map(p => [p.longitude, p.latitude]) as any,
    getColor: (d: VesselTrajectory) => {
      const rank = getVesselRank(d.vessel_id);
      return rank === 1
        ? [14, 165, 233, 255]   // Marine Cyan (#0EA5E9)
        : [16, 185, 129, 180]; // Safe Emerald (#10B981)
    },
    getWidth: (d: VesselTrajectory) => {
      const rank = getVesselRank(d.vessel_id);
      return rank === 1 ? 3 : 2;
    },
    updateTriggers: {
      getColor: [attribution],
      getWidth: [attribution]
    }
  });
}
