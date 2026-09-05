import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { AttributedVessel, VesselTrackPoint } from '../types/attributionTypes';
import type { TimelineVesselPosition } from '../timeline/useInvestigationTimeline';
import { LAYER_IDS } from './layerIds';

export interface CulpritMarkerDatum {
  vesselId: string;
  vesselName: string;
  rank: number;
  isMock: boolean;
  longitude: number;
  latitude: number;
  timestamp: string;
  timestampMs: number;
  speed: number | null;
  course: number | null;
  distanceFromBacktrackOriginKm: number | null;
}

export interface VesselLayerOptions {
  /** Full ranked vessels (for track polylines and markers). */
  vessels: AttributedVessel[];
  /** Playhead-interpolated positions (markers when timeline is scrubbed). */
  vesselPositions: TimelineVesselPosition[];
  /** Whether vessel attribution visualization is active for selected spill. */
  active?: boolean;
}

/** Rank → color hierarchy: #1 gold, #2 silver-slate, #3 warm amber, #4 indigo, 5+ muted. */
export function getRankColor(rank: number): [number, number, number, number] {
  if (rank === 1) return [250, 204, 21, 245]; // Gold
  if (rank === 2) return [148, 163, 184, 220]; // Silver-slate
  if (rank === 3) return [251, 146, 60, 215]; // Warm amber/orange
  if (rank === 4) return [129, 140, 248, 210]; // Indigo-400
  return [100, 116, 139, 190];
}

export function getTrackColor(rank: number): [number, number, number, number] {
  const [r, g, b] = getRankColor(rank);
  return rank === 1 ? [r, g, b, 230] : [r, g, b, 175];
}

function formatUtcTime(timestamp: string): string {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;
  } catch {
    return timestamp;
  }
}

/**
 * Deck.gl layers for ranked AIS candidate vessels:
 * 1. Historical AIS trajectory polylines (PathLayer) using backend-provided points
 * 2. Dedicated Rank-1 Culprit / Potential Source marker (ScatterplotLayer + TextLayer)
 * 3. Candidate vessel markers at playhead/culprit positions (ScatterplotLayer + TextLayer)
 */
export function createVesselLayers(options: VesselLayerOptions): Layer[] {
  const { vessels, vesselPositions, active = true } = options;
  if (!active || vessels.length === 0) return [];

  const layers: Layer[] = [];

  // --- 1. Vessel Trajectory Paths ---
  // Authoritative backend display points (e.g. 5 points per vessel)
  const withTracks = vessels.filter((v) => v.trajectory.length >= 2);

  if (withTracks.length > 0) {
    layers.push(
      new PathLayer<AttributedVessel>({
        id: LAYER_IDS.vesselTracks,
        data: withTracks,
        getPath: (d) =>
          d.trajectory.map((p: VesselTrackPoint) => [p.longitude, p.latitude] as [number, number]),
        getColor: (d) => getTrackColor(d.rank),
        getWidth: (d) => (d.rank === 1 ? 3 : 1.75),
        widthUnits: 'pixels',
        widthMinPixels: 1.5,
        jointRounded: true,
        capRounded: true,
        pickable: true,
        updateTriggers: {
          getPath: withTracks.map((v) => `${v.vesselId}:${v.trajectory.length}`).join(','),
          getColor: withTracks.map((v) => v.rank).join(','),
          getWidth: withTracks.map((v) => v.rank).join(','),
        },
      })
    );
  }

  // --- 2. Rank 1 Culprit / Potential Source Marker ---
  // Rendered separately from the historical trajectory (MAP-07 Section 11)
  const rank1 = vessels.find((v) => v.rank === 1);
  if (rank1 && rank1.culpritLocation) {
    const culpritDatum: CulpritMarkerDatum = {
      vesselId: rank1.vesselId,
      vesselName: rank1.vesselName,
      rank: 1,
      isMock: rank1.isMock,
      longitude: rank1.culpritLocation.longitude,
      latitude: rank1.culpritLocation.latitude,
      timestamp: rank1.culpritLocation.timestamp,
      timestampMs: rank1.culpritLocation.timestampMs,
      speed: rank1.culpritLocation.speed,
      course: rank1.culpritLocation.course,
      distanceFromBacktrackOriginKm: rank1.distanceFromBacktrackOriginKm,
    };

    // Outer glow / halo ring for Potential Source
    layers.push(
      new ScatterplotLayer<CulpritMarkerDatum>({
        id: `${LAYER_IDS.culpritMarker}-halo`,
        data: [culpritDatum],
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: 16,
        radiusUnits: 'pixels',
        radiusMinPixels: 12,
        filled: true,
        stroked: true,
        getFillColor: [234, 179, 8, 45],
        getLineColor: [234, 179, 8, 180],
        lineWidthUnits: 'pixels',
        getLineWidth: 1.5,
        pickable: false,
      })
    );

    // Main marker
    layers.push(
      new ScatterplotLayer<CulpritMarkerDatum>({
        id: LAYER_IDS.culpritMarker,
        data: [culpritDatum],
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: 9,
        radiusUnits: 'pixels',
        radiusMinPixels: 7,
        filled: true,
        stroked: true,
        getFillColor: [234, 179, 8, 250],
        getLineColor: [255, 255, 255, 255],
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        pickable: true,
      })
    );

    // Label: Potential Source Position
    const timeLabel = formatUtcTime(rank1.culpritLocation.timestamp);
    layers.push(
      new TextLayer<CulpritMarkerDatum>({
        id: LAYER_IDS.culpritMarkerLabel,
        data: [culpritDatum],
        getPosition: (d) => [d.longitude, d.latitude],
        getText: () => `★ Potential Source (${timeLabel})`,
        getSize: 11,
        getColor: [254, 240, 138, 255],
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        getPixelOffset: [14, 0],
        fontSettings: { sdf: true },
        outlineWidth: 2.5,
        outlineColor: [15, 23, 42, 230],
        pickable: false,
      })
    );
  }

  // --- 3. Candidate Vessel Markers (All Ranks) ---
  // Positions synchronized with playhead if timeline is active, or fallback to culprit/track
  const candidatePositions: TimelineVesselPosition[] =
    vesselPositions.length > 0
      ? vesselPositions
      : vessels
          .map((v) => {
            const loc = v.culpritLocation || v.trajectory[0];
            if (!loc) return null;
            return {
              vesselId: v.vesselId,
              rank: v.rank,
              vesselName: v.vesselName,
              isMock: v.isMock,
              longitude: loc.longitude,
              latitude: loc.latitude,
              heading: loc.heading ?? loc.course,
            };
          })
          .filter((p): p is TimelineVesselPosition => p !== null);

  if (candidatePositions.length > 0) {
    layers.push(
      new ScatterplotLayer<TimelineVesselPosition>({
        id: LAYER_IDS.vesselMarkers,
        data: candidatePositions,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: (d) => (d.rank === 1 ? 8 : 6),
        radiusUnits: 'pixels',
        radiusMinPixels: 5,
        filled: true,
        stroked: true,
        getFillColor: (d) => getRankColor(d.rank),
        getLineColor: [255, 255, 255, 230],
        lineWidthUnits: 'pixels',
        getLineWidth: 1.5,
        pickable: true,
        updateTriggers: {
          getPosition: candidatePositions
            .map((v) => `${v.vesselId}:${v.longitude}:${v.latitude}`)
            .join('|'),
          getFillColor: candidatePositions.map((v) => v.rank).join(','),
        },
      })
    );

    layers.push(
      new TextLayer<TimelineVesselPosition>({
        id: `${LAYER_IDS.vesselMarkers}-labels`,
        data: candidatePositions,
        getPosition: (d) => [d.longitude, d.latitude],
        getText: (d) => `#${d.rank}`,
        getSize: 10,
        getColor: [255, 255, 255, 240],
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        getPixelOffset: [0, -13],
        fontSettings: { sdf: true },
        outlineWidth: 2,
        outlineColor: [15, 23, 42, 220],
        pickable: false,
        updateTriggers: {
          getPosition: candidatePositions
            .map((v) => `${v.vesselId}:${v.longitude}:${v.latitude}`)
            .join('|'),
        },
      })
    );
  }

  return layers;
}
