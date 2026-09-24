import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { Layer, PickingInfo } from '@deck.gl/core';
import type { MapSpill } from '../types/spillTypes';
import { LAYER_IDS } from './layerIds';
import {
  DIMMED_ALPHA,
  MAX_RADIUS_PX,
  SELECTION_RGB,
  SPILL_RGB,
  alphaForConfidence,
  createAreaScale,
  radiusForArea,
} from './spillEncoding';
import {
  buildOilPatchFillBands,
  buildOilPatchGlowBands,
  buildOilPatchIsolines,
  buildOilPatchSpeckles,
  smoothRing,
} from '../utils/oilPatchGeometry';
import type { OilPatchBand } from '../utils/oilPatchGeometry';

export interface SpillLayerOptions {
  spills: MapSpill[];
  selectedSpillId: string | null;
  /** Pre-resolved/detailed selected spill (with polygon etc.) */
  selectedSpill?: MapSpill | null;
  /** Hide unselected detections entirely instead of dimming them. */
  focusMode: boolean;
  onSelectSpill: (spillId: string) => void;
  /**
   * True whenever the investigation timeline is armed (Focus Mode's
   * traveling polygon is on screen), regardless of `focusMode`. `focusMode`
   * and the timeline are independent toggles in the UI (see
   * `InvestigationPanel.tsx`'s "Focus mode" and "Investigate vessels"
   * buttons) — a user can arm the timeline without ever turning Focus Mode
   * on. The static authoritative-polygon layer below must still render in
   * that case so the traveling polygon's detection-handoff fade
   * (`oilSlickKeyframes.ts`'s `detectionHandoffOpacity`) has something real
   * to reveal underneath it instead of fading to bare basemap.
   */
  backtrackActive: boolean;
  /**
   * False while the traveling slick is out along its track (away from the
   * detection end), so the map never shows two slicks at once. Flips back to
   * true inside the detection handoff window, where the traveling polygon
   * dissolves into this one. Defaults to true.
   */
  showDetectionPolygon?: boolean;
}

/**
 * Detect whether a polygon is an artificial 4/5-point axis-aligned bounding box
 * from object detection models (e.g. YOLO / Faster R-CNN on SAR images).
 */
function isBoundingBoxPolygon(polygon: [number, number][]): boolean {
  if (!polygon || (polygon.length !== 4 && polygon.length !== 5)) return false;
  const lons = new Set(polygon.map((p) => Math.round(p[0] * 10000)));
  const lats = new Set(polygon.map((p) => Math.round(p[1] * 10000)));
  // An axis-aligned rectangle has at most 2 distinct X and 2 distinct Y values
  return lons.size <= 2 && lats.size <= 2;
}

/**
 * Convert a rigid detection bounding box into a realistic organic fluid oil slick contour.
 * Keeps the slick strictly contained within the satellite observation footprint,
 * but replaces the harsh artificial square corners with natural fluid surface geometry.
 */
function createOrganicSlickContour(
  bbox: [number, number][],
  spillId: string,
  numPoints: number = 40
): [number, number][] {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of bbox) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const rx = (maxLon - minLon) / 2;
  const ry = (maxLat - minLat) / 2;

  // Deterministic seed from spillId so shape remains rock-solid stable across re-renders
  let hash = 0;
  for (let i = 0; i < spillId.length; i++) {
    hash = (hash << 5) - hash + spillId.charCodeAt(i);
    hash |= 0;
  }
  const s1 = Math.abs((hash % 1000) / 1000);
  const s2 = Math.abs(((hash >> 4) % 1000) / 1000);
  const s3 = Math.abs(((hash >> 8) % 1000) / 1000);

  const points: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const theta = (i / numPoints) * 2 * Math.PI;

    // Multi-frequency harmonic perturbation simulating hydrographic fluid
    // spreading: low-frequency lobes/tendrils plus fractal high-frequency
    // edge detail, so the rim reads ragged like real sheen, not a blob.
    const wave1 = Math.sin(3 * theta + s1 * 6.28) * 0.16;
    const wave2 = Math.cos(5 * theta + s2 * 6.28) * 0.1;
    const wave3 = Math.sin(7 * theta + s3 * 6.28) * 0.05;
    const fractal =
      Math.sin(13 * theta + s2 * 11.3) * 0.035 +
      Math.sin(23 * theta + s1 * 7.7) * 0.025 +
      Math.sin(37 * theta + s3 * 5.1) * 0.016;

    // Two narrow tendril arms (Gaussian radius bumps) pulled out of the body.
    const arm = (at: number, amp: number, w: number) => {
      const d = Math.atan2(Math.sin(theta - at), Math.cos(theta - at));
      return amp * Math.exp(-((d / w) ** 2));
    };
    const tendrils = arm(s2 * 2 * Math.PI, 0.3, 0.2) + arm(s3 * 2 * Math.PI + 2.4, 0.18, 0.16);

    // Body stays inside the SAR bounding box; only the tendril tips may reach slightly past it.
    const r = Math.min(1.16, Math.max(0.58, Math.min(0.97, 0.84 + wave1 + wave2 + wave3 + fractal) + tendrils));

    const lon = centerLon + rx * r * Math.cos(theta);
    const lat = centerLat + ry * r * Math.sin(theta);
    points.push([lon, lat]);
  }

  // Close loop
  points.push([points[0][0], points[0][1]]);
  return points;
}

export function getResolvedSpillPolygon(selected: MapSpill): [number, number][] {
  if (!selected.polygon || selected.polygon.length < 3) return [];

  if (isBoundingBoxPolygon(selected.polygon)) {
    return createOrganicSlickContour(selected.polygon, selected.spillId, 120);
  }

  // If already an organic multi-vertex polygon (> 5 points), return as-is
  return selected.polygon;
}

/**
 * One flat-colour band of the gradient/fringe fake — see `oilPatchGeometry.ts`.
 * Inner fill bands carry a hairline contour outline (`band.line`) so the
 * thickness steps read as contours; isolines (`kind: 'line'`) are outline
 * only. The boundary itself stays unstroked — the fringe bands draw it.
 */
function createBandLayer(idPrefix: string, index: number, band: OilPatchBand): PolygonLayer<OilPatchBand> {
  const isLine = band.kind === 'line';
  const line = isLine ? { rgb: band.rgb, alpha: band.alpha } : band.line;
  return new PolygonLayer<OilPatchBand>({
    id: `${idPrefix}-${index}`,
    data: [band],
    getPolygon: (d) => d.ring,
    filled: !isLine,
    stroked: line != null,
    getFillColor: (d) => [...d.rgb, d.alpha],
    getLineColor: line ? [...line.rgb, line.alpha] : [0, 0, 0, 0],
    lineWidthUnits: 'pixels',
    getLineWidth: isLine ? 1 : 0.8,
    lineWidthMinPixels: 0.6,
    pickable: false,
  });
}

/**
 * Authoritative oil slick boundary polygon for the selected spill detection —
 * a smoothed outline filled with a dark-core/warm-sheen gradient and a soft
 * outward glow, in place of one flat colour and a hard stroke (see
 * `oilPatchGeometry.ts` and `spillEncoding.ts`'s `OIL_PATCH_STOPS`/
 * `OIL_GLOW_STOPS` for why — real oil doesn't render as a single flat tint
 * with a ruled border). Ordered glow-then-fill, each band widest/faintest
 * first, so every layer paints correctly under the ones meant to sit on top
 * of it.
 */
function createSpillPolygonLayers(selected: MapSpill): PolygonLayer<OilPatchBand>[] {
  const resolvedPolygon = getResolvedSpillPolygon(selected);
  if (resolvedPolygon.length < 4) return [];

  const smoothed = smoothRing(resolvedPolygon);
  const glowBands = buildOilPatchGlowBands(smoothed);
  const fillBands = buildOilPatchFillBands(smoothed);
  const isolines = buildOilPatchIsolines(smoothed);
  const speckles = buildOilPatchSpeckles(smoothed);

  return [
    ...isolines.map((band, i) => createBandLayer(`${LAYER_IDS.spillPolygon}-iso`, i, band)),
    ...glowBands.map((band, i) => createBandLayer(`${LAYER_IDS.spillPolygon}-glow`, i, band)),
    ...fillBands.map((band, i) => createBandLayer(`${LAYER_IDS.spillPolygon}-fill`, i, band)),
    ...speckles.map((band, i) => createBandLayer(`${LAYER_IDS.spillPolygon}-spot`, i, band)),
  ];
}

/** Ring drawn around the spill under investigation. */
function createSelectionRingLayer(
  selected: MapSpill,
  maxSqrtArea: number
): ScatterplotLayer<MapSpill> {
  return new ScatterplotLayer<MapSpill>({
    id: LAYER_IDS.spillSelectionRing,
    data: [selected],
    getPosition: (d) => [d.longitude, d.latitude],
    // Offset outward from the dot so the ring reads as an annotation, not a halo.
    getRadius: (d) => radiusForArea(d.areaKm2, maxSqrtArea) + 9,
    radiusUnits: 'pixels',
    filled: false,
    stroked: true,
    getLineColor: [...SELECTION_RGB, 235],
    lineWidthUnits: 'pixels',
    getLineWidth: 1.75,
    pickable: false,
  });
}

/**
 * Detected oil spills as proportional symbols and authoritative slick polygons.
 *
 * Returns polygon first (bottom), selection ring second, dots third (top).
 */
export function createSpillLayers(options: SpillLayerOptions): Layer[] {
  const { spills, selectedSpillId, selectedSpill, focusMode, onSelectSpill, backtrackActive } = options;
  const showDetectionPolygon = options.showDetectionPolygon ?? true;
  if (spills.length === 0) return [];

  const maxSqrtArea = createAreaScale(spills);
  const selected =
    selectedSpill ??
    (selectedSpillId ? spills.find((spill) => spill.spillId === selectedSpillId) ?? null : null);

  // In focus mode only the selected spill is rendered. Without a selection there
  // is nothing to focus on, so the full set stays visible.
  const data = focusMode && selected ? [selected] : spills;

  const dotsLayer = new ScatterplotLayer<MapSpill>({
    id: LAYER_IDS.spillDots,
    data,
    getPosition: (d) => [d.longitude, d.latitude],
    getRadius: (d) => radiusForArea(d.areaKm2, maxSqrtArea),
    radiusUnits: 'pixels',
    // A large slick can still be a small mark when the dataset scale is wide;
    // keep every detection clickable.
    radiusMinPixels: 4,
    radiusMaxPixels: MAX_RADIUS_PX,
    filled: true,
    getFillColor: (d) => {
      // Selected keeps full-strength colour; the rest recede once an
      // investigation is open so the subject dominates without losing context.
      if (selected && d.spillId !== selected.spillId) {
        return [...SPILL_RGB, DIMMED_ALPHA] as [number, number, number, number];
      }
      return [...SPILL_RGB, alphaForConfidence(d.confidenceScore)] as [
        number,
        number,
        number,
        number,
      ];
    },
    stroked: true,
    lineWidthUnits: 'pixels',
    getLineWidth: (d) => (d.spillId === selected?.spillId ? 2 : 1),
    getLineColor: (d) => {
      if (d.spillId === selected?.spillId) return [255, 255, 255, 255];
      if (selected) return [255, 255, 255, 40];
      return [255, 255, 255, 150];
    },
    pickable: true,
    autoHighlight: true,
    highlightColor: [...SELECTION_RGB, 255],
    onClick: (info: PickingInfo<MapSpill>) => {
      if (!info.object) return false;
      onSelectSpill(info.object.spillId);
      // Stop the click here so it never reaches the basemap behind the dot.
      return true;
    },
    // Fade rather than snap when an investigation opens or clears.
    transitions: {
      getFillColor: 350,
      getLineColor: 350,
      getLineWidth: 350,
    },
    // deck.gl only re-evaluates the colour/width accessors when this changes.
    updateTriggers: {
      getFillColor: [selected?.spillId ?? null],
      getLineColor: [selected?.spillId ?? null],
      getLineWidth: [selected?.spillId ?? null],
    },
  });

  const layers: Layer[] = [];
  if (selected) {
    // Render the detailed organic slick geometry when Focus Mode is ON, OR
    // whenever the investigation timeline is armed — the traveling polygon's
    // detection-handoff fade (see oilSlickKeyframes.ts) needs this layer
    // present underneath it to reveal, even if the user never toggled Focus
    // Mode on separately (the two are independent controls; see
    // `backtrackActive`'s docstring above).
    if (
      showDetectionPolygon &&
      (focusMode || backtrackActive) &&
      selected.polygon &&
      selected.polygon.length >= 3
    ) {
      layers.push(...createSpillPolygonLayers(selected));
    }
    layers.push(createSelectionRingLayer(selected, maxSqrtArea));
  }
  layers.push(dotsLayer);

  return layers;
}
