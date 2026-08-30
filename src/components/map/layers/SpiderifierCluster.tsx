import { ScatterplotLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import type { VesselTrajectory, AttributionResult } from '../../../types/map';
import { createVesselMarkerLayer } from '../VesselMarkerLayer';
import { createVesselTrackLayer } from '../VesselTrackLayer';

interface ClusteredVesselsProps {
  trajectories: Record<string, VesselTrajectory>;
  attribution: AttributionResult | null;
  zoom: number;
  expandedClusterId: string | null;
  onClusterClick: (clusterId: string) => void;
  visible: boolean;
  theme: 'light' | 'dark';
}

export function createClusteredVesselsLayers({
  trajectories,
  attribution,
  zoom,
  expandedClusterId,
  onClusterClick,
  visible,
  theme
}: ClusteredVesselsProps) {
  if (!visible) return [];

  // Extract current vessel positions (last points)
  const vesselsList = Object.values(trajectories)
    .filter(v => v.points.length > 0)
    .map(v => {
      const lastPoint = v.points[v.points.length - 1];
      return {
        vessel_id: v.vessel_id,
        vessel_type: v.vessel_type,
        longitude: lastPoint.longitude,
        latitude: lastPoint.latitude,
        course: lastPoint.course,
        speed: lastPoint.speed,
        fullData: v
      };
    });

  // If zoom >= 7.0, decluster everything: just render normal vessels
  if (zoom >= 7.0) {
    return [
      createVesselTrackLayer({ trajectories, attribution, visible }),
      createVesselMarkerLayer({ trajectories, attribution, visible })
    ].flat();
  }

  // Simple distance-based clustering
  const clusters: any[] = [];
  const threshold = 0.5; // degrees

  vesselsList.forEach(v => {
    let found = false;
    for (let c of clusters) {
      const dx = Math.abs(c.longitude - v.longitude);
      const dy = Math.abs(c.latitude - v.latitude);
      if (dx < threshold && dy < threshold) {
        c.vessels.push(v);
        // Recalculate centroid
        c.longitude = c.vessels.reduce((acc: number, val: any) => acc + val.longitude, 0) / c.vessels.length;
        c.latitude = c.vessels.reduce((acc: number, val: any) => acc + val.latitude, 0) / c.vessels.length;
        found = true;
        break;
      }
    }
    if (!found) {
      clusters.push({
        id: `cluster-${clusters.length}`,
        longitude: v.longitude,
        latitude: v.latitude,
        vessels: [v]
      });
    }
  });

  const layers: any[] = [];
  const unclusteredTrajectories: Record<string, VesselTrajectory> = {};
  const spiderLegs: any[] = [];
  const spiderCenterDots: any[] = [];
  const unexpandedClusters: any[] = [];

  clusters.forEach(c => {
    if (c.vessels.length === 1) {
      // Unclustered single vessel
      const v = c.vessels[0];
      unclusteredTrajectories[v.vessel_id] = v.fullData;
    } else {
      // Cluster of multiple vessels
      if (c.id === expandedClusterId) {
        // Expand/Spiderify this cluster
        const angleStep = (2 * Math.PI) / c.vessels.length;
        const radius = 0.12 / Math.pow(1.5, zoom - 4.5); // Proportional radial spread

        // Center dot
        spiderCenterDots.push({
          longitude: c.longitude,
          latitude: c.latitude
        });

        c.vessels.forEach((v: any, i: number) => {
          const angle = i * angleStep;
          const targetLon = c.longitude + radius * Math.cos(angle);
          const targetLat = c.latitude + radius * Math.sin(angle);

          // Add spider leg line
          spiderLegs.push({
            path: [
              [c.longitude, c.latitude],
              [targetLon, targetLat]
            ]
          });

          // Create updated trajectory for rendering at spider position
          const shiftedPoints = v.fullData.points.map((p: any, idx: number) => {
            if (idx === v.fullData.points.length - 1) {
              return { ...p, longitude: targetLon, latitude: targetLat };
            }
            return p;
          });

          unclusteredTrajectories[v.vessel_id] = {
            ...v.fullData,
            points: shiftedPoints
          };
        });
      } else {
        // Standard unexpanded cluster node
        unexpandedClusters.push(c);
      }
    }
  });

  // 1. Render spider legs (thin path lines connecting center to pins)
  if (spiderLegs.length > 0) {
    layers.push(
      new PathLayer({
        id: 'spider-legs-layer',
        data: spiderLegs,
        pickable: false,
        widthScale: 1,
        widthMinPixels: 1.5,
        getPath: (d: any) => d.path,
        getColor: theme === 'dark' ? [148, 163, 184, 120] : [100, 116, 139, 120], // slate-400 / slate-500
        getWidth: 1.5
      })
    );
  }

  // 2. Render original cluster center points (small dots)
  if (spiderCenterDots.length > 0) {
    layers.push(
      new ScatterplotLayer({
        id: 'spider-center-dot-layer',
        data: spiderCenterDots,
        pickable: false,
        getPosition: (d: any) => [d.longitude, d.latitude],
        getFillColor: theme === 'dark' ? [148, 163, 184, 200] : [100, 116, 139, 200],
        getRadius: 100,
        radiusMinPixels: 4,
        radiusMaxPixels: 6
      })
    );
  }

  // 3. Render unexpanded cluster circles
  if (unexpandedClusters.length > 0) {
    layers.push(
      new ScatterplotLayer({
        id: 'cluster-circle-layer',
        data: unexpandedClusters,
        pickable: true,
        getPosition: (d: any) => [d.longitude, d.latitude],
        getFillColor: [14, 165, 233, 255], // Marine Cyan (#0EA5E9)
        getRadius: 300,
        radiusMinPixels: 16,
        radiusMaxPixels: 24,
        onClick: (info) => {
          if (info.object) {
            onClusterClick(info.object.id);
          }
        }
      })
    );

    // 4. Render cluster counts text
    layers.push(
      new TextLayer({
        id: 'cluster-text-layer',
        data: unexpandedClusters,
        pickable: false,
        getPosition: (d: any) => [d.longitude, d.latitude],
        getText: (d: any) => d.vessels.length.toString(),
        getSize: 12,
        getColor: [15, 17, 23, 255], // Dark charcoal text
        getAngle: 0,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        fontWeight: 'bold',
        fontFamily: 'Inter, sans-serif'
      })
    );
  }

  // 5. Render all unclustered vessels + expanded spiderified vessels
  if (Object.keys(unclusteredTrajectories).length > 0) {
    layers.push(
      createVesselTrackLayer({ trajectories: unclusteredTrajectories, attribution, visible }),
      createVesselMarkerLayer({ trajectories: unclusteredTrajectories, attribution, visible })
    );
  }

  return layers.flat();
}
export default createClusteredVesselsLayers;
