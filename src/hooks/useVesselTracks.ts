// src/hooks/useVesselTracks.ts
import { useState, useEffect } from 'react';
import type { VesselCandidate, VesselTrack } from '../types/vessel';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://naavss.duckdns.org/api/v1/demo';

// Generate synthetic vessel trajectory for demo
function generateVesselPath(
  origin: { latitude: number; longitude: number },
  spillTime: string,
  vesselId: string
): [number, number, number][] {
  const spillTs = new Date(spillTime).getTime();
  const path: [number, number, number][] = [];

  // Seed randomness by vessel ID for consistent paths
  const seed = vesselId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pseudoRand = (i: number) => Math.sin(seed * 1000 + i * 127.1) * 0.5 + 0.5;

  // Generate 40 waypoints over ±6 hours around spill time
  const numPoints = 40;
  const timeSpan = 6 * 60 * 60 * 1000; // 6 hours in ms

  for (let i = 0; i < numPoints; i++) {
    const t = spillTs - timeSpan + (i / (numPoints - 1)) * timeSpan * 2;
    const progress = i / (numPoints - 1);

    const approachAngle = pseudoRand(0) * Math.PI * 2;
    const dist = (1 - Math.sin(progress * Math.PI)) * 0.08;

    const lng = origin.longitude + Math.cos(approachAngle) * dist * (1 - progress * 0.3);
    const lat = origin.latitude + Math.sin(approachAngle) * dist * (1 - progress * 0.3);

    path.push([lng, lat, t]);
  }

  return path;
}

export function useVesselTracks(
  spillId: string | null,
  selectedSpill: any,
  attribution: any
) {
  const [tracks, setTracks] = useState<VesselTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spillId) {
      setTracks([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/spills/${spillId}/vessels`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error ${r.status}`);
        return r.json();
      })
      .then((data: { vessels: VesselCandidate[] }) => {
        if (!selectedSpill) return;

        const origin = {
          latitude: attribution?.source_estimate?.latitude ?? selectedSpill.centroid.lat,
          longitude: attribution?.source_estimate?.longitude ?? selectedSpill.centroid.lon,
        };

        const colors: [number, number, number][] = [
          [245, 158, 11],  // Rank 1: Orange (SUSPECT)
          [148, 163, 184], // Rank 2: Gray
          [100, 116, 139], // Rank 3: Dark gray
          [71, 85, 105],   // Rank 4: Darker gray
        ];

        const vesselTracks: VesselTrack[] = (data.vessels || [])
          .filter((v) => !v.is_mock || v.rank <= 3)
          .map((vessel) => ({
            vesselId: vessel.vessel_id,
            path: generateVesselPath(
              origin,
              selectedSpill.detected_at,
              vessel.vessel_id
            ),
            color: colors[Math.min(vessel.rank - 1, colors.length - 1)],
            name: vessel.vessel_name ?? vessel.vessel_id,
            rank: vessel.rank,
          }));

        setTracks(vesselTracks);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Vessel tracks fetch error:', err);
        setError(err.message || 'Failed to load vessel tracks');
        setTracks([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [spillId, selectedSpill, attribution]);

  return { tracks, loading, error };
}
