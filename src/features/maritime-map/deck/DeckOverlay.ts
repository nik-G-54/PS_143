import { MapboxOverlay } from '@deck.gl/mapbox';
import { getDeckLayers } from './deckLayers';

export function createDeckOverlay(): MapboxOverlay {
  return new MapboxOverlay({
    interleaved: true,
    layers: getDeckLayers(),
  });
}
