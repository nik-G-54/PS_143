import { IconLayer } from '@deck.gl/layers';

interface AnimatedVesselLayerProps {
  position: { lat: number; lng: number; course: number } | null;
  visible: boolean;
}

const SHIP_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="white">
     <path d="M12 2C11.5 5 10 9 8 13.5C7.2 15.3 6.8 17.2 7 19C7.2 21 8.8 22 12 22C15.2 22 16.8 21 17 19C17.2 17.2 16.8 15.3 16 13.5C14 9 12.5 5 12 2Z"/>
   </svg>`
)}`;

const ICON_MAPPING = {
  ship: { x: 0, y: 0, width: 32, height: 32, mask: true }
};

export function createAnimatedVesselLayer({ position, visible }: AnimatedVesselLayerProps) {
  if (!position || !visible) return null;

  return new IconLayer<{ lat: number; lng: number; course: number }>({
    id: 'animated-vessel-layer',
    data: [position],
    pickable: true,
    visible,
    iconAtlas: SHIP_SVG,
    iconMapping: ICON_MAPPING,
    getIcon: () => 'ship',
    getPosition: (d: { lat: number; lng: number; course: number }) => [d.lng, d.lat],
    getSize: 28,
    // deck.gl angles rotate counter-clockwise.
    // If course is clockwise from North (0 degrees), we negate it.
    getAngle: (d: { lat: number; lng: number; course: number }) => -d.course,
    getColor: [251, 146, 60, 255] // bright orange-400 (#FB923C)
  });
}
export default createAnimatedVesselLayer;
