import { LineLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { SpillEnvironment, EnvironmentVector } from '../types/trajectoryTypes';
import { LAYER_IDS } from './layerIds';

export interface EnvironmentLayerOptions {
  environment: SpillEnvironment | null;
  showWind: boolean;
  showCurrent: boolean;
}

interface EnvArrow {
  id: string;
  kind: 'wind' | 'current';
  from: [number, number];
  to: [number, number];
  speed: number;
  directionDeg: number;
  unit: string;
}

/** Rough degrees-of-lon offset for a readable arrow length at Mediterranean latitudes. */
const ARROW_LENGTH_DEG = 0.025;

function vectorToArrow(
  kind: 'wind' | 'current',
  vector: EnvironmentVector,
  lon: number,
  lat: number,
  lonOffset: number,
  latOffset: number
): EnvArrow {
  // Backend direction is degrees clockwise from north (toward for current / as-given for wind).
  const rad = (vector.directionDeg * Math.PI) / 180;
  const dLon = ARROW_LENGTH_DEG * Math.sin(rad);
  const dLat = ARROW_LENGTH_DEG * Math.cos(rad);
  const fromLon = lon + lonOffset;
  const fromLat = lat + latOffset;

  return {
    id: `${kind}-${vector.directionDeg.toFixed(1)}`,
    kind,
    from: [fromLon, fromLat],
    to: [fromLon + dLon, fromLat + dLat],
    speed: vector.speed,
    directionDeg: vector.directionDeg,
    unit: vector.unit,
  };
}

function buildArrows(
  environment: SpillEnvironment,
  showWind: boolean,
  showCurrent: boolean
): EnvArrow[] {
  const arrows: EnvArrow[] = [];
  if (showWind && environment.wind) {
    arrows.push(
      vectorToArrow('wind', environment.wind, environment.longitude, environment.latitude, -0.012, 0.012)
    );
  }
  if (showCurrent && environment.current) {
    arrows.push(
      vectorToArrow(
        'current',
        environment.current,
        environment.longitude,
        environment.latitude,
        0.012,
        -0.012
      )
    );
  }
  return arrows;
}

const WIND_RGBA: [number, number, number, number] = [59, 130, 246, 230];
const CURRENT_RGBA: [number, number, number, number] = [6, 182, 212, 230];

/**
 * Optional wind / current vectors at the detection.
 * Hidden unless the investigator toggles them on — never calculated on the frontend.
 */
export function createEnvironmentLayers(options: EnvironmentLayerOptions): Layer[] {
  const { environment, showWind, showCurrent } = options;
  if (!environment || (!showWind && !showCurrent)) return [];

  const arrows = buildArrows(environment, showWind, showCurrent);
  if (arrows.length === 0) return [];

  const wind = arrows.filter((a) => a.kind === 'wind');
  const current = arrows.filter((a) => a.kind === 'current');
  const layers: Layer[] = [];

  const makeLine = (id: string, data: EnvArrow[], color: [number, number, number, number]) =>
    new LineLayer<EnvArrow>({
      id,
      data,
      getSourcePosition: (d) => d.from,
      getTargetPosition: (d) => d.to,
      getColor: color,
      getWidth: 3,
      widthUnits: 'pixels',
      pickable: true,
      updateTriggers: {
        getSourcePosition: [environment.longitude, environment.latitude],
        getTargetPosition: [environment.wind?.directionDeg, environment.current?.directionDeg],
      },
    });

  const makeHead = (id: string, data: EnvArrow[], color: [number, number, number, number]) =>
    new ScatterplotLayer<EnvArrow>({
      id,
      data,
      getPosition: (d) => d.to,
      getRadius: 5,
      radiusUnits: 'pixels',
      radiusMinPixels: 4,
      filled: true,
      stroked: true,
      getFillColor: color,
      getLineColor: [255, 255, 255, 200],
      lineWidthUnits: 'pixels',
      getLineWidth: 1,
      pickable: true,
    });

  // Tiny label markers via TextLayer at the tip.
  const makeLabel = (id: string, data: EnvArrow[], color: [number, number, number, number]) =>
    new TextLayer<EnvArrow>({
      id,
      data,
      getPosition: (d) => d.to,
      getText: (d) => (d.kind === 'wind' ? 'W' : 'C'),
      getSize: 10,
      getColor: color,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      getPixelOffset: [0, -12],
      pickable: false,
    });

  if (wind.length > 0) {
    layers.push(makeLine(LAYER_IDS.windArrows, wind, WIND_RGBA));
    layers.push(makeHead(`${LAYER_IDS.windArrows}-head`, wind, WIND_RGBA));
    layers.push(makeLabel(`${LAYER_IDS.windArrows}-label`, wind, WIND_RGBA));
  }
  if (current.length > 0) {
    layers.push(makeLine(LAYER_IDS.currentArrows, current, CURRENT_RGBA));
    layers.push(makeHead(`${LAYER_IDS.currentArrows}-head`, current, CURRENT_RGBA));
    layers.push(makeLabel(`${LAYER_IDS.currentArrows}-label`, current, CURRENT_RGBA));
  }

  return layers;
}

export type { EnvArrow };
