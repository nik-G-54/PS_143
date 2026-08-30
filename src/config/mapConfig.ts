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
    page: '#0F1117',
    sidebar: '#13151D',
    card: '#1A1D27',
    border: '#252830',
    primary: '#00D9A6',
    heading: '#F1F5F9',
    body: '#94A3B8',
    muted: '#64748B',
  },
  light: {
    page: '#FFFFFF',
    sidebar: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#00B894',
    heading: '#1A1D23',
    body: '#4B5563',
    muted: '#9CA3AF',
  },
};
