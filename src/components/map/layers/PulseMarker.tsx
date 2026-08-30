import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { SpillEvent } from '../../../types/map';

export function usePulseMarkers(
  map: maplibregl.Map | null,
  spills: SpillEvent[],
  onSelect: (spill: SpillEvent) => void,
  visible: boolean = true
) {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    // Clear old markers first
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!map || !visible) return;

    spills.forEach(spill => {
      const el = document.createElement('div');
      el.className = 'pulse-marker';
      el.innerHTML = `
        <div style="position:relative;width:24px;height:24px;cursor:pointer;">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;" />
          <div style="position:absolute;inset:3px;border-radius:50%;background:rgba(239,68,68,0.6);animation:pulse 2s ease-in-out infinite;" />
          <div style="position:absolute;inset:6px;border-radius:50%;background:#EF4444;" />
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect(spill);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([spill.centroid.longitude, spill.centroid.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [map, spills, onSelect, visible]);
}
export default usePulseMarkers;
