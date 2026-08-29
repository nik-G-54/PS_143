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
        ? [0, 217, 166, 255]   // Green for #1 suspect (#00D9A6)
        : [100, 116, 139, 180]; // Gray for others (#64748B)
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
