import { Theme } from '../types/ui';

export const MAP_STYLES: Record<Theme, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

export const INITIAL_VIEW_STATE = {
  longitude: 18.0,    // Mediterranean center
  latitude: 37.0,
  zoom: 4.5,
  pitch: 0,
  bearing: 0,
};

export const FLY_TO_CONFIG = {
  duration: 1200,
  essential: true,
};

// Claude Amber Design Tokens
export const THEME_COLORS = {
  dark: {
    page: '#262624',       // Warm Dark Background
    sidebar: '#1f1e1d',    // Dark Sidebar Background
    card: '#2c2c2b',       // Warm Charcoal Card Surface
    border: '#3e3e38',     // Dark Border
    primary: '#d97757',    // Claude Amber Rust
    heading: '#f1f1ef',    // Foreground Light Text
    body: '#b7b5a9',       // Muted Foreground Text
    muted: '#1b1b19',      // Dark Muted Surface
  },
  light: {
    page: '#faf9f5',       // Warm Cream Background
    sidebar: '#f5f4ee',    // Light Sidebar Background
    card: '#f5f4ef',       // Warm Soft White Card
    border: '#dad9d4',     // Light Border
    primary: '#c96442',    // Claude Terracotta Amber
    heading: '#3d3929',    // Foreground Warm Charcoal
    body: '#6e6d68',       // Muted Text
    muted: '#ede9de',      // Light Muted Surface
  },
};
