export type MapTheme = 'dark' | 'light';
export type BasemapMode = 'standard' | 'satellite';

// Free development satellite provider (Esri World Imagery)
// No API key required for prototype/development usage.
// For production, replace with a licensed provider.
import cartoLabels from './cartoLabels.json';

const ESRI_SATELLITE_STYLE = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0a1628'
      }
    },
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite'
    }
  ]
};

const SATELLITE_STYLE = {
  version: 8,
  sprite: cartoLabels.sprite,
  glyphs: cartoLabels.glyphs,
  sources: {
    ...ESRI_SATELLITE_STYLE.sources,
    ...cartoLabels.sources,
  },
  layers: [
    ...ESRI_SATELLITE_STYLE.layers,
    ...cartoLabels.layers,
  ]
};

export const MAP_CONFIG = {
  styles: {
    standard: {
      dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    },
    satellite: {
      dark: SATELLITE_STYLE as any,
      light: SATELLITE_STYLE as any,
    }
  },
  initialCamera: {
    longitude: 18.0,  // Mediterranean Sea
    latitude: 37.0,
    // Zoom 1.8 shows a clearly recognizable spherical Earth with
    // Mediterranean / Europe / Africa visible. This is the globe-first
    // experience — user zooms IN to reach detailed geography.
    zoom: 1.8,
    pitch: 0,
    bearing: 0,
  }
};
