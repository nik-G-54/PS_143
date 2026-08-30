import { useMemo } from 'react';
import type { 
  SpillEvent, 
  AttributionResult, 
  EnvironmentData, 
  HindcastResult, 
  VesselTrajectory 
} from '../types/map';
import { LayerVisibility } from '../types/ui';
import { createSpillLayer } from '../components/map/SpillLayer';
import { createSourceRegionLayer } from '../components/map/SourceRegionLayer';
import { createHindcastParticlesLayer } from '../components/map/HindcastParticlesLayer';
import { createWindCurrentArrowsLayer } from '../components/map/WindCurrentArrows';
import { createAnimatedVesselLayer } from '../components/map/layers/AnimatedVessel';
import { createClusteredVesselsLayers } from '../components/map/layers/SpiderifierCluster';

interface UseMapLayersProps {
  spills: SpillEvent[];
  selectedSpill: SpillEvent | null;
  attribution: AttributionResult | null;
  environment: EnvironmentData | null;
  hindcast: HindcastResult | null;
  trajectories: Record<string, VesselTrajectory>;
  onSpillClick: (spill: SpillEvent) => void;
  layers: LayerVisibility;
  animatedVesselPosition: { lat: number; lng: number; course: number } | null;
  zoom: number;
  expandedClusterId: string | null;
  onClusterClick: (clusterId: string) => void;
  theme: 'light' | 'dark';
}

export function useMapLayers({
  spills,
  selectedSpill,
  attribution,
  environment,
  hindcast,
  trajectories,
  onSpillClick,
  layers,
  animatedVesselPosition,
  zoom,
  expandedClusterId,
  onClusterClick,
  theme
}: UseMapLayersProps) {
  return useMemo(() => {
    const hasSelection = !!selectedSpill;

    return [
      // 1. Spills Layer
      createSpillLayer({
        data: spills,
        selectedSpillId: selectedSpill ? selectedSpill.spill_id : null,
        onClick: onSpillClick,
        visible: layers.spills
      }),

      // 2. Source Region Layer
      createSourceRegionLayer({
        data: hindcast,
        visible: hasSelection && layers.hindcast
      }),

      // 3. Hindcast Drift Particles Path Layer
      createHindcastParticlesLayer({
        data: hindcast,
        visible: hasSelection && layers.hindcast
      }),

      // 4. Clustered Vessels Layer (Clustered & Spiderified)
      createClusteredVesselsLayers({
        trajectories,
        attribution,
        zoom,
        expandedClusterId,
        onClusterClick,
        visible: hasSelection && layers.vessels,
        theme
      }),

      // 5. Wind and Current Vector Arrow Icon Layer
      createWindCurrentArrowsLayer({
        environment,
        visible: hasSelection && layers.wind
      }),

      // 6. Animated Primary Suspect Vessel Layer
      createAnimatedVesselLayer({
        position: animatedVesselPosition,
        visible: hasSelection && layers.vessels
      })
    ].flat().filter(Boolean); // Flat in case any helper returns multiple layers, filtering out nulls
  }, [
    spills,
    selectedSpill,
    attribution,
    environment,
    hindcast,
    trajectories,
    onSpillClick,
    layers,
    animatedVesselPosition,
    zoom,
    expandedClusterId,
    onClusterClick,
    theme
  ]);
}
export default useMapLayers;
