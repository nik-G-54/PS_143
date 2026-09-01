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

// Averra design tokens
export const THEME_COLORS = {
  dark: {
    page: '#090D16',       // Deep Ocean Black
    sidebar: '#151F33',    // Midnight Slate
    card: '#151F33',       // Midnight Slate
    border: '#64748B',     // Steel Gray
    primary: '#0EA5E9',    // Marine Cyan
    heading: '#F8FAFC',    // Pure Ice
    body: '#94A3B8',       // Fog Slate
    muted: '#64748B',      // Steel Gray
  },
  light: {
    page: '#FFFFFF',
    sidebar: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#0EA5E9',    // Marine Cyan
    heading: '#1A1D23',
    body: '#4B5563',
    muted: '#9CA3AF',
  },
};
