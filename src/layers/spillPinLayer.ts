// src/layers/spillPinLayer.ts
import { IconLayer } from "@deck.gl/layers";
import type { SpillEvent } from "../types/spill";

/* Reference-style Google Maps teardrop pin */
const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z";

const CELL = 96;

const TINTS = [
  { key: "pin-low",  fill: "#F87171", min: 0,    max: 0.7  },
  { key: "pin-mid",  fill: "#DC2626", min: 0.7,  max: 0.85 },
  { key: "pin-high", fill: "#8B1B1B", min: 0.85, max: 1.01 },
] as const;

const ATLAS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="${CELL * TINTS.length}" height="${CELL}" viewBox="0 0 ${CELL * TINTS.length} ${CELL}">
  ${TINTS.map(
    (t, i) => `
    <g transform="translate(${i * CELL} 0) scale(${CELL / 24})">
      <path fill="${t.fill}" fill-rule="evenodd" d="${PIN_PATH}" />
    </g>`
  ).join("")}
</svg>`;

export const PIN_ATLAS = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ATLAS_SVG)}`;

const ICON_MAPPING: Record<string, any> = TINTS.reduce((acc, t, i) => {
  acc[t.key] = {
    x: i * CELL,
    y: 0,
    width: CELL,
    height: CELL,
    anchorX: CELL / 2,
    anchorY: CELL - 8,
    mask: false,
  };
  return acc;
}, {} as Record<string, any>);

function pinKeyFor(confidence: number) {
  if (confidence >= 0.85) return "pin-high";
  if (confidence >= 0.7) return "pin-mid";
  return "pin-low";
}

export function createSpillPinLayer(
  spills: SpillEvent[],
  onSpillClick?: (spill: SpillEvent) => void
) {
  return new IconLayer<SpillEvent>({
    id: "spill-pins",
    data: spills,
    pickable: true,
    iconAtlas: PIN_ATLAS,
    iconMapping: ICON_MAPPING,
    getIcon: (d) => pinKeyFor(d.confidence_score),
    getPosition: (d) => [d.centroid.lon, d.centroid.lat],
    getSize: (d) =>
      Math.min(64, Math.max(24, Math.sqrt(d.area_km2 || 1) * 8 + 26)),
    sizeMinPixels: 20,
    sizeMaxPixels: 60,
    onClick: ({ object }) => {
      if (object) onSpillClick?.(object);
    },
  });
}
