// src/features/maritime-map/layers/ReferenceLayer.ts
//
// Passive spatial-reference layers — coastline outline and lat/long
// graticule — so the drift/forecast paths read against real geography
// instead of floating on an unmarked basemap. Both layers are `pickable:
// false` and rendered at low opacity: they exist to orient the eye, not to
// compete with the spill/vessel/drift layers for attention.

import { GeoJsonLayer, PathLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import type { Layer } from '@deck.gl/core';
import { LAYER_IDS } from './layerIds';
import type { CoastlineGeoJSON } from '../utils/coastalAlert';

export interface ReferenceLayerOptions {
  /** Parsed coastline extract (see `coastlineConfig.ts`), or null before it loads. */
  coastline: CoastlineGeoJSON | null;
  /** Off by default — the coastline alone is usually enough context; the grid is an extra. */
  showGraticule?: boolean;
}

const COASTLINE_RGBA: [number, number, number, number] = [148, 163, 184, 130];
const GRATICULE_RGBA: [number, number, number, number] = [148, 163, 184, 45];

/** Degrees between graticule lines — coarse enough to stay a subtle backdrop, not a grid overlay. */
const GRATICULE_STEP_DEG = 10;
/** Sample spacing along each line so it follows the globe's curvature instead of drawing a straight chord. */
const GRATICULE_SAMPLE_DEG = 2;

function range(from: number, to: number, step: number): number[] {
  const values: number[] = [];
  for (let v = from; v <= to; v += step) values.push(v);
  return values;
}

/** One static global graticule, built once — meridians (fixed longitude) and parallels (fixed latitude). */
function buildGraticulePaths(): Array<[number, number][]> {
  const paths: Array<[number, number][]> = [];

  for (const lon of range(-180, 180, GRATICULE_STEP_DEG)) {
    paths.push(range(-80, 80, GRATICULE_SAMPLE_DEG).map((lat) => [lon, lat] as [number, number]));
  }
  for (const lat of range(-80, 80, GRATICULE_STEP_DEG)) {
    paths.push(range(-180, 180, GRATICULE_SAMPLE_DEG).map((lon) => [lon, lat] as [number, number]));
  }

  return paths;
}

let cachedGraticule: Array<[number, number][]> | null = null;
function getGraticulePaths(): Array<[number, number][]> {
  if (!cachedGraticule) cachedGraticule = buildGraticulePaths();
  return cachedGraticule;
}

/**
 * Coastline outline (stroke only, no fill) plus an optional dashed lat/long
 * graticule. Ordered to sit under every other layer — see `MaritimeMap.tsx`'s
 * paint-order comment — so it reads as basemap context, not a drawn feature.
 */
export function createReferenceLayers(options: ReferenceLayerOptions): Layer[] {
  const { coastline, showGraticule = false } = options;
  const layers: Layer[] = [];

  if (showGraticule) {
    layers.push(
      new PathLayer<[number, number][], { getDashArray: number[]; dashJustified: boolean }>({
        id: LAYER_IDS.graticule,
        data: getGraticulePaths(),
        getPath: (d) => d,
        getColor: GRATICULE_RGBA,
        getWidth: 1,
        widthUnits: 'pixels',
        widthMinPixels: 1,
        getDashArray: [3, 3],
        dashJustified: true,
        extensions: [new PathStyleExtension({ dash: true })],
        pickable: false,
      })
    );
  }

  if (coastline) {
    layers.push(
      new GeoJsonLayer({
        id: LAYER_IDS.coastline,
        data: coastline,
        stroked: true,
        filled: false,
        getLineColor: COASTLINE_RGBA,
        getLineWidth: 1,
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 1,
        pickable: false,
      })
    );
  }

  return layers;
}
