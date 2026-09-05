// src/components/map/VesselTrackLayer.tsx
import { useMemo } from 'react';
import { TripsLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer, TextLayer, IconLayer } from '@deck.gl/layers';
import type { VesselTrack } from '../../types/vessel';

interface VesselTrackLayerProps {
  tracks: VesselTrack[];
  currentTime: number; // Unix ms — for animation
  visible: boolean;
  showTrails: boolean;
}

// Vessel SVG icon
const VESSEL_ICON = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="24" cy="24" r="20" fill="${color}22" stroke="${color}" stroke-width="2" filter="url(#glow)"/>
  <path d="M24 8 L30 20 L24 16 L18 20 Z" fill="${color}" filter="url(#glow)"/>
  <circle cx="24" cy="24" r="3" fill="${color}"/>
</svg>`)}`;

export function useVesselTrackLayers(
  tracks: VesselTrack[],
  currentTime: number,
  visible = true,
  showTrails = true
) {
  return useMemo(() => {
    if (!visible || !tracks.length) return [];

    const result: any[] = [];

    // TripsLayer — animated vessel trails
    if (showTrails) {
      tracks.forEach((track) => {
        result.push(
          new TripsLayer({
            id: `vessel-trail-${track.vesselId}`,
            data: [{ path: track.path }],
            getPath: (d: any) => d.path,
            getTimestamps: (d: any) => d.path.map((p: any) => p[2]),
            getColor: track.color,
            widthMinPixels: track.rank === 1 ? 4 : 2,
            widthMaxPixels: track.rank === 1 ? 6 : 4,
            trailLength: 1800000, // 30 min trail in ms
            currentTime,
            opacity: track.rank === 1 ? 0.9 : 0.5,
            parameters: { depthTest: false },
          })
        );
      });
    }

    // Current vessel position markers
    const vesselPositions = tracks.map((track) => {
      // Find position closest to currentTime
      const closest = track.path.reduce((prev, curr) =>
        Math.abs(curr[2] - currentTime) < Math.abs(prev[2] - currentTime)
          ? curr
          : prev
      );
      return {
        position: [closest[0], closest[1]] as [number, number],
        color: track.color,
        name: track.name,
        rank: track.rank,
        vesselId: track.vesselId,
      };
    });

    // Rank 1 suspect — bigger, pulsing
    const suspect = vesselPositions.find((v) => v.rank === 1);
    if (suspect) {
      result.push(
        // Pulsing ring for top suspect
        new ScatterplotLayer({
          id: 'vessel-suspect-ring',
          data: [suspect],
          getPosition: (d: any) => d.position,
          getRadius: 400,
          getFillColor: [0, 0, 0, 0],
          getLineColor: [245, 158, 11, 200], // Orange ring
          stroked: true,
          lineWidthMinPixels: 3,
          radiusMinPixels: 20,
          radiusMaxPixels: 30,
          radiusScale: 1,
          parameters: { depthTest: false },
        })
      );
    }

    // All vessel icons
    result.push(
      new IconLayer({
        id: 'vessel-icons',
        data: vesselPositions,
        getIcon: (d: any) => ({
          url: VESSEL_ICON(`rgb(${d.color[0]},${d.color[1]},${d.color[2]})`),
          width: 48,
          height: 48,
        }),
        getPosition: (d: any) => d.position,
        getSize: (d: any) => (d.rank === 1 ? 35 : 22),
        sizeMinPixels: (d: any) => (d.rank === 1 ? 25 : 16),
        sizeMaxPixels: (d: any) => (d.rank === 1 ? 40 : 25),
        billboard: true,
        parameters: { depthTest: false },
      })
    );

    // Rank badges
    result.push(
      new TextLayer({
        id: 'vessel-badges',
        data: vesselPositions,
        getPosition: (d: any) => [
          d.position[0],
          d.position[1] + 0.006,
        ],
        getText: (d: any) => `#${d.rank} ${d.name}`,
        getSize: (d: any) => (d.rank === 1 ? 12 : 9),
        getColor: (d: any) => [...d.color, 255],
        fontFamily: 'Space Grotesk, monospace',
        fontWeight: (d: any) => (d.rank === 1 ? '800' : '600'),
        textAnchor: 'middle',
        alignmentBaseline: 'bottom',
        billboard: true,
        parameters: { depthTest: false },
      })
    );

    // Dotted arc from Rank 1 vessel to origin
    if (tracks.length > 0) {
      const topTrack = tracks.find((t) => t.rank === 1);
      if (topTrack) {
        const vesselPos = vesselPositions.find((v) => v.rank === 1);
        const originPos = [
          topTrack.path[0][0],
          topTrack.path[0][1],
        ];

        if (vesselPos) {
          result.push(
            new ScatterplotLayer({
              id: 'guilt-arc-dots',
              data: Array.from({ length: 15 }, (_, i) => {
                const t = i / 14;
                return {
                  position: [
                    vesselPos.position[0] +
                      (originPos[0] - vesselPos.position[0]) * t,
                    vesselPos.position[1] +
                      (originPos[1] - vesselPos.position[1]) * t,
                  ],
                };
              }),
              getPosition: (d: any) => d.position,
              getRadius: 40,
              getFillColor: [245, 158, 11, 150],
              radiusMinPixels: 2,
              radiusMaxPixels: 3,
              parameters: { depthTest: false },
            })
          );
        }
      }
    }

    return result;
  }, [tracks, currentTime, visible, showTrails]);
}

export function VesselTrackLayer({
  tracks,
  currentTime,
  visible,
  showTrails,
}: VesselTrackLayerProps) {
  return null;
}
