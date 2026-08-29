export type Theme = 'light' | 'dark';

export interface LayerVisibility {
  spills: boolean;
  hindcast: boolean;
  vessels: boolean;
  wind: boolean;
}

export interface TooltipData {
  x: number;
  y: number;
  type: 'spill' | 'vessel' | 'source-region';
  data: {
    id?: string;
    name?: string;
    confidence?: number;
    status?: string;
    severity?: string;
    vesselType?: string;
    speed?: number;
  };
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
  transitionInterpolator?: any;
}
