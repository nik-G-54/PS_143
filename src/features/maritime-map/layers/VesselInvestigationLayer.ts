import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import type { Layer } from '@deck.gl/core';
import type { AttributedVessel } from '../types/attributionTypes';
import type { SourceEstimate } from '../types/trajectoryTypes';
import type { VesselRevealStage } from '../investigation/useVesselRevealStage';
import { LAYER_IDS } from './layerIds';
import { buildShipMesh } from './shipMesh';
import { metersPerPixel } from '../utils/geo';

/**
 * The post-timeline "who did this" reveal: the rank-1 candidate's ship at its
 * position when the oil was released, a dotted distance line back to the
 * drift's own origin marker (already drawn by `TrajectoryLayer.ts` — this
 * layer never redraws it), and scale ticks along that line. Gated entirely by
 * `stage` (`useVesselRevealStage.ts`) so nothing here renders until the
 * investigation timeline has actually finished playing.
 */

/**
 * `SimpleMeshLayer.sizeScale` (meters per raw mesh unit) recomputed from the
 * current zoom so the ship holds a roughly constant *screen* size instead of
 * a fixed real-world one. A true-to-scale ~200m hull is sub-pixel by the
 * `VESSEL_FRAME_*` wide shot's zoom (12) and would vanish exactly the way it
 * was — real ships at globe-ish zoom levels are genuinely invisible. The
 * reference this was ported from (`public/3d-visualisation/app.js`) already
 * documents the same call for the same reason: its own `limitations` field
 * says outright "Ship and waves exaggerated for legibility." Clamped so it
 * doesn't explode into something absurd if the camera is zoomed out far
 * beyond the choreographed reveal beats.
 */
const SHIP_TARGET_SCREEN_LENGTH_PX = 90;
const MIN_SHIP_SIZE_SCALE = 8;
// High enough that the ~90px target actually holds down to a wide manual
// zoom-out (~zoom 9), not just within the choreographed 12-15 range —
// 260 looked right on paper but only covered zoom >= ~11.5; a user zooming
// out further than that (the exact complaint this fix is for) hit the clamp
// and the ship shrank to a few-pixel sliver again, silently reproducing the
// bug this was meant to fix. Still bounded so an extreme zoom-out (globe-ish
// view) caps the ship at a large-but-finite size instead of growing without limit.
const MAX_SHIP_SIZE_SCALE = 900;

function shipSizeScaleForZoom(latitude: number, zoom: number, hullLengthUnits: number): number {
  const metersPerPx = metersPerPixel(latitude, zoom);
  if (!(metersPerPx > 0) || !(hullLengthUnits > 0)) return MIN_SHIP_SIZE_SCALE;
  const desiredLengthMeters = SHIP_TARGET_SCREEN_LENGTH_PX * metersPerPx;
  const scale = desiredLengthMeters / hullLengthUnits;
  return Math.min(MAX_SHIP_SIZE_SCALE, Math.max(MIN_SHIP_SIZE_SCALE, scale));
}

/** [255,255,255] tells SimpleMeshLayer to use the mesh's own baked vertex colours unmixed. */
const SHIP_TINT: [number, number, number] = [255, 255, 255];
/** Gold, matching `VesselLayer.ts`'s existing rank-1 marker — used only if the mesh ship can't be built. */
const FALLBACK_SHIP_RGB: [number, number, number, number] = [250, 204, 21, 235];

const LINE_RGB: [number, number, number] = [138, 138, 138];
const TICK_RGB: [number, number, number] = [181, 181, 181];
const TICK_INTERVAL_KM = 2;

/** Compass heading (0=N, clockwise) to deck.gl `SimpleMeshLayer` yaw (degrees, counter-clockwise from local +X/east). */
function headingToYawDeg(headingCompassDeg: number | null): number {
  return 90 - (headingCompassDeg ?? 0);
}

export interface VesselRevealPoint {
  longitude: number;
  latitude: number;
}

export interface VesselRevealLayerOptions {
  stage: VesselRevealStage;
  origin: SourceEstimate | null;
  vessel: AttributedVessel | null;
  /** False if the mesh ship failed to build/render — falls back to a simple marker. */
  useShipMesh: boolean;
  /** Current map zoom — re-derives the ship's `sizeScale` so it holds a roughly constant screen size. */
  zoom: number;
}

interface ShipDatum {
  position: [number, number];
  yawDeg: number;
}

function createShipLayer(
  vessel: VesselRevealPoint,
  yawDeg: number,
  useMesh: boolean,
  zoom: number
): Layer {
  const datum: ShipDatum = { position: [vessel.longitude, vessel.latitude], yawDeg };

  if (useMesh) {
    const mesh = buildShipMesh();
    const sizeScale = shipSizeScaleForZoom(vessel.latitude, zoom, mesh.lengthUnits);
    return new SimpleMeshLayer<ShipDatum>({
      id: LAYER_IDS.vesselRevealShip,
      data: [datum],
      mesh,
      getPosition: (d) => d.position,
      getOrientation: (d) => [0, d.yawDeg, 0],
      getColor: SHIP_TINT,
      sizeScale,
      pickable: false,
      // Pop-in: scale animates 0 -> 1 the moment this layer's data first appears.
      getScale: [1, 1, 1],
      transitions: { getScale: { duration: 650, easing: (t: number) => 1 - (1 - t) ** 3 } },
    });
  }

  return new ScatterplotLayer<ShipDatum>({
    id: LAYER_IDS.vesselRevealShip,
    data: [datum],
    getPosition: (d) => d.position,
    getRadius: 9,
    radiusUnits: 'pixels',
    radiusMinPixels: 7,
    filled: true,
    stroked: true,
    getFillColor: FALLBACK_SHIP_RGB,
    getLineColor: [255, 255, 255, 235],
    lineWidthUnits: 'pixels',
    getLineWidth: 2,
    pickable: false,
    transitions: { getRadius: { duration: 500, easing: (t: number) => 1 - (1 - t) ** 3 } },
  });
}

/** Short perpendicular hash marks along the origin→vessel line, one per `TICK_INTERVAL_KM`. */
function buildScaleTicks(
  origin: VesselRevealPoint,
  vessel: VesselRevealPoint,
  distanceKm: number
): [number, number][][] {
  if (!(distanceKm > TICK_INTERVAL_KM)) return [];

  const dLon = vessel.longitude - origin.longitude;
  const dLat = vessel.latitude - origin.latitude;
  const latRad = (origin.latitude * Math.PI) / 180;
  const lonScale = Math.cos(latRad) || 1;
  const dx = dLon * lonScale;
  const dy = dLat;
  const len = Math.hypot(dx, dy) || 1;
  const perpXDeg = (-dy / len / lonScale) * 0.0025;
  const perpYDeg = (dx / len) * 0.0025;

  const steps = Math.floor(distanceKm / TICK_INTERVAL_KM);
  const ticks: [number, number][][] = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = (i * TICK_INTERVAL_KM) / distanceKm;
    const lon = origin.longitude + dLon * t;
    const lat = origin.latitude + dLat * t;
    ticks.push([
      [lon + perpXDeg, lat + perpYDeg],
      [lon - perpXDeg, lat - perpYDeg],
    ]);
  }
  return ticks;
}

export function createVesselRevealLayers(options: VesselRevealLayerOptions): Layer[] {
  const { stage, origin, vessel, useShipMesh, zoom } = options;
  if (stage === 'idle' || stage === 'framing' || !origin || !vessel?.culpritLocation) return [];

  const vesselPoint: VesselRevealPoint = {
    longitude: vessel.culpritLocation.longitude,
    latitude: vessel.culpritLocation.latitude,
  };
  const yawDeg = headingToYawDeg(vessel.culpritLocation.heading ?? vessel.culpritLocation.course);

  const layers: Layer[] = [createShipLayer(vesselPoint, yawDeg, useShipMesh, zoom)];

  const showLine = stage === 'distance' || stage === 'closeup' || stage === 'done';
  if (showLine) {
    const originPoint: VesselRevealPoint = { longitude: origin.longitude, latitude: origin.latitude };
    const path: [number, number][] = [
      [originPoint.longitude, originPoint.latitude],
      [vesselPoint.longitude, vesselPoint.latitude],
    ];
    const distanceKm = vessel.distanceFromOriginKm ?? 0;

    layers.push(
      new PathLayer({
        id: LAYER_IDS.vesselRevealLine,
        data: [{ path }],
        getPath: (d: { path: [number, number][] }) => d.path,
        getColor: [...LINE_RGB, 210] as [number, number, number, number],
        getWidth: 2,
        widthUnits: 'pixels',
        widthMinPixels: 1.5,
        capRounded: true,
        getDashArray: [3, 2] as [number, number],
        dashJustified: true,
        extensions: [new PathStyleExtension({ dash: true })],
        pickable: false,
        opacity: 1,
        transitions: { getColor: { duration: 700 } },
      })
    );

    const ticks = buildScaleTicks(originPoint, vesselPoint, distanceKm);
    if (ticks.length > 0) {
      layers.push(
        new PathLayer({
          id: LAYER_IDS.vesselRevealTicks,
          data: ticks.map((path) => ({ path })),
          getPath: (d: { path: [number, number][] }) => d.path,
          getColor: [...TICK_RGB, 160] as [number, number, number, number],
          getWidth: 1.5,
          widthUnits: 'pixels',
          pickable: false,
        })
      );
    }
  }

  return layers;
}
