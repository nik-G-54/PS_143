import { ScatterplotLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
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

export interface SpillLayerOptions {
  spills: MapSpill[];
  selectedSpillId: string | null;
  /** Hide unselected detections entirely instead of dimming them. */
  focusMode: boolean;
  onSelectSpill: (spillId: string) => void;
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
 * Detected oil spills as proportional symbols.
 *
 * Returns a selection ring first and the dots second so the dots paint on top —
 * deck.gl renders layers in array order.
 */
export function createSpillLayers(options: SpillLayerOptions): ScatterplotLayer<MapSpill>[] {
  const { spills, selectedSpillId, focusMode, onSelectSpill } = options;
  if (spills.length === 0) return [];

  const maxSqrtArea = createAreaScale(spills);
  const selected = selectedSpillId
    ? (spills.find((spill) => spill.spillId === selectedSpillId) ?? null)
    : null;

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

  return selected ? [createSelectionRingLayer(selected, maxSqrtArea), dotsLayer] : [dotsLayer];
}
