import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { AttributedVessel } from '../types/attributionTypes';
import type { TimelineVesselPosition } from '../timeline/useInvestigationTimeline';
import { LAYER_IDS } from './layerIds';

export interface VesselLayerOptions {
  /** Full ranked vessels (for track polylines). */
  vessels: AttributedVessel[];
  /** Playhead-interpolated positions (markers). */
  vesselPositions: TimelineVesselPosition[];
  /** When false, no vessel geometry is drawn. */
  backtrackActive: boolean;
  /**
   * True once the post-timeline vessel-reveal sequence is active
   * (`useVesselRevealStage.ts`). The moving rank-1 marker sits at the
   * timeline's *current scrub time* (usually the detection end once Play has
   * run to completion), while the reveal's ship sits at a different, fixed
   * moment — the spill-release time (`culpritLocation`). Showing both at once
   * reads as two contradictory positions for the same vessel, so the moving
   * marker (not the static track line, which is still useful context) hides
   * for the duration of the reveal.
   */
  hideMovingMarker?: boolean;
}

/** Rank → colour: #1 gold, #2 silver-blue, #3+ muted. */
function rankColor(rank: number): [number, number, number, number] {
  if (rank === 1) return [250, 204, 21, 230];
  if (rank === 2) return [148, 163, 184, 220];
  if (rank === 3) return [251, 146, 60, 210];
  return [100, 116, 139, 200];
}

function trackColor(rank: number): [number, number, number, number] {
  const [r, g, b] = rankColor(rank);
  return [r, g, b, 140];
}

/**
 * Ranked AIS vessels for the backtrack investigation.
 * Tracks are static polylines from the backend; markers move with the timeline playhead.
 */
export function createVesselLayers(options: VesselLayerOptions): Layer[] {
  const { vessels, vesselPositions, backtrackActive, hideMovingMarker = false } = options;
  if (!backtrackActive) return [];

  const layers: Layer[] = [];
  // Only display vessel trajectory on the map for Rank 1; remove trajectory for rank null vessels
  const withTracks = vessels.filter((v) => (v.rawRank === 1 || v.rank === 1) && v.track.length >= 2);

  if (withTracks.length > 0) {
    layers.push(
      new PathLayer<AttributedVessel>({
        id: LAYER_IDS.vesselTracks,
        data: withTracks,
        getPath: (d) => d.track.map((p) => [p.longitude, p.latitude] as [number, number]),
        getColor: (d) => trackColor(d.rank),
        getWidth: 2,
        widthUnits: 'pixels',
        widthMinPixels: 1.5,
        jointRounded: true,
        capRounded: true,
        pickable: true,
        updateTriggers: {
          getPath: withTracks.map((v) => v.vesselId).join(','),
          getColor: withTracks.map((v) => v.rank).join(','),
        },
      })
    );
  }

  // Render yellow dot marker exclusively for Rank 1 vessel
  const rank1Positions = hideMovingMarker ? [] : vesselPositions.filter((p) => p.rank === 1);

  if (rank1Positions.length > 0) {
    layers.push(
      new ScatterplotLayer<TimelineVesselPosition>({
        id: LAYER_IDS.vesselMarkers,
        data: rank1Positions,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: 8,
        radiusUnits: 'pixels',
        radiusMinPixels: 6,
        filled: true,
        stroked: true,
        getFillColor: [250, 204, 21, 230], // Yellow dot for rank 1
        getLineColor: [255, 255, 255, 230],
        lineWidthUnits: 'pixels',
        getLineWidth: 1.5,
        pickable: true,
        updateTriggers: {
          getPosition: rank1Positions.map((v) => `${v.vesselId}:${v.longitude}:${v.latitude}`).join('|'),
        },
      })
    );

    layers.push(
      new TextLayer<TimelineVesselPosition>({
        id: `${LAYER_IDS.vesselMarkers}-labels`,
        data: rank1Positions,
        getPosition: (d) => [d.longitude, d.latitude],
        getText: () => '#1',
        getSize: 11,
        getColor: [255, 255, 255, 240],
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        getPixelOffset: [0, -14],
        outlineWidth: 2,
        outlineColor: [15, 23, 42, 220],
        pickable: false,
        updateTriggers: {
          getPosition: rank1Positions.map((v) => `${v.vesselId}:${v.longitude}:${v.latitude}`).join('|'),
        },
      })
    );
  }

  return layers;
}
