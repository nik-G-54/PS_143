// src/components/map/WindCurrentArrows.tsx
import { IconLayer } from '@deck.gl/layers';
import type { EnvironmentData, WindArrow } from '../../types/map';

interface WindCurrentArrowsProps {
  environment: EnvironmentData | null;
  visible: boolean;
}

const ARROW_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="white">
     <path d="M12 2L4.5 20.29l.71.71L12 17l6.79 4 .71-.71z"/>
   </svg>`
)}`;

const ICON_MAPPING = {
  arrow: { x: 0, y: 0, width: 32, height: 32, mask: true }
};

export function createWindCurrentArrowsLayer({ environment, visible }: WindCurrentArrowsProps) {
  if (!environment || !visible) {
    return [];
  }

  // Derive wind and current arrow representations
  // Offset them slightly from the centroid to avoid overlapping
  const arrows: WindArrow[] = [
    {
      longitude: environment.location.longitude - 0.015,
      latitude: environment.location.latitude + 0.015,
      angle: environment.wind.direction_deg,
      speed: environment.wind.speed_mps,
      type: 'wind'
    },
    {
      longitude: environment.location.longitude + 0.015,
      latitude: environment.location.latitude - 0.015,
      angle: environment.current.direction_deg,
      speed: environment.current.speed_mps,
      type: 'current'
    }
  ];

  return new IconLayer<WindArrow>({
    id: 'wind-current-arrows-layer',
    data: arrows,
    pickable: true,
    visible,
    iconAtlas: ARROW_SVG,
    iconMapping: ICON_MAPPING,
    getIcon: () => 'arrow',
    getPosition: (d: WindArrow) => [d.longitude, d.latitude],
    getSize: 28,
    // deck.gl angles rotate counter-clockwise.
    // If direction is clockwise from North (0 degrees), we negate it.
    getAngle: (d: WindArrow) => -d.angle,
    getColor: (d: WindArrow) => 
      d.type === 'wind' 
        ? [59, 130, 246, 220]  // Blue [59, 130, 246, 220] (#3B82F6)
        : [6, 182, 212, 220],  // Cyan [6, 182, 212, 220] (#06B6D4)
    updateTriggers: {
      getPosition: [environment],
      getAngle: [environment],
      getColor: [environment]
    }
  });
}
