// src/lib/exportUtils.ts
import type { SpillEvent } from '../types/spill';
import type { VisualizationData, SpillDetail } from '../types/detail';

/**
 * Export map as PNG using canvas
 */
export async function exportMapPNG(mapRef: any, filename?: string): Promise<void> {
  const map = mapRef?.getMap ? mapRef.getMap() : mapRef?.current ? mapRef.current.getMap() : mapRef;
  const canvas = map?.getCanvas ? map.getCanvas() : null;

  if (!canvas) {
    console.error('Map canvas not available');
    return;
  }

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b: Blob | null) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `sentinel-map-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export PNG failed:', err);
  }
}

/**
 * Helper to check if polygon array is a single linear ring of coordinates [[lng, lat], ...]
 */
function isLinearRing(arr: any): boolean {
  return Array.isArray(arr) && Array.isArray(arr[0]) && (typeof arr[0][0] === 'number' || Array.isArray(arr[0][0]));
}

/**
 * Export spill data as GeoJSON
 */
export function exportSpillGeoJSON(
  spills: SpillEvent[],
  selectedSpill?: SpillEvent | SpillDetail | null,
  vizData?: VisualizationData | null,
  filename?: string
): void {
  const features: any[] = [];

  // Add all spill markers as points
  const markerSpills = selectedSpill 
    ? spills.filter(s => s.spill_id !== selectedSpill.spill_id)
    : spills;

  markerSpills.forEach(spill => {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [spill.centroid.lon, spill.centroid.lat]
      },
      properties: {
        id: spill.spill_id,
        area_km2: spill.area_km2,
        confidence_score: spill.confidence_score,
        detected_at: spill.detected_at,
        type: 'spill_marker'
      }
    });
  });

  // Add selected spill polygon if available with geometry nesting check
  const polygonData = (selectedSpill as any)?.polygon || (vizData as any)?.spill?.polygon;
  if (selectedSpill && polygonData) {
    const formattedCoordinates = isLinearRing(polygonData) && typeof polygonData[0][0] === 'number' 
      ? [polygonData] 
      : polygonData;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: formattedCoordinates
      },
      properties: {
        id: selectedSpill.spill_id,
        type: 'spill_polygon',
        area_km2: selectedSpill.area_km2
      }
    });
  }

  // Add estimated source point
  const sourceLat = (selectedSpill as any)?.estimated_source_latitude ?? vizData?.source_estimate?.latitude;
  const sourceLon = (selectedSpill as any)?.estimated_source_longitude ?? vizData?.source_estimate?.longitude;
  const sourceRadius = (selectedSpill as any)?.estimated_source_radius_km ?? vizData?.source_estimate?.radius_km;

  if (selectedSpill && sourceLat && sourceLon) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [sourceLon, sourceLat]
      },
      properties: {
        id: selectedSpill.spill_id,
        type: 'estimated_source',
        radius_km: sourceRadius
      }
    });
  }

  // Add trajectory line
  if (vizData?.trajectory && vizData.trajectory.length > 0) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: vizData.trajectory.map(t => [t.longitude, t.latitude])
      },
      properties: {
        type: 'drift_trajectory',
        points: vizData.trajectory.length
      }
    });
  }

  const geojson = {
    type: 'FeatureCollection',
    features,
    properties: {
      exported_at: new Date().toISOString(),
      source: 'Sentinel Oil Spill Detection Platform',
      total_spills: spills.length
    }
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `sentinel-spills-${Date.now()}.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
