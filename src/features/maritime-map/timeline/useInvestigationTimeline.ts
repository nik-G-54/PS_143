import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SpillTrajectory } from '../types/trajectoryTypes';
import type { AttributedVessel } from '../types/attributionTypes';
import { vesselPositionAt } from '../adapters/attributionTrajectoryAdapter';

export interface TimelineVesselPosition {
  vesselId: string;
  rank: number;
  vesselName: string;
  isMock: boolean;
  longitude: number;
  latitude: number;
  heading: number | null;
}

export interface UseInvestigationTimelineResult {
  /** 0 = oldest / origin end, 1 = detection. */
  progress: number;
  setProgress: (value: number) => void;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  /** Absolute time corresponding to progress, or null with no trajectory. */
  currentTimeMs: number | null;
  /** Oil position at the playhead. */
  oilPosition: { longitude: number; latitude: number } | null;
  /** Path clipped to the playhead (oldest → current). */
  visiblePoints: SpillTrajectory['points'];
  vesselPositions: TimelineVesselPosition[];
  windowLabel: string;
}

const PLAY_DURATION_MS = 12_000;

function interpolateOil(
  points: SpillTrajectory['points'],
  timeMs: number
): { longitude: number; latitude: number } | null {
  if (points.length === 0) return null;
  if (timeMs <= points[0].timestampMs) {
    return { longitude: points[0].longitude, latitude: points[0].latitude };
  }
  const last = points[points.length - 1];
  if (timeMs >= last.timestampMs) {
    return { longitude: last.longitude, latitude: last.latitude };
  }

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (timeMs > b.timestampMs) continue;
    const span = b.timestampMs - a.timestampMs;
    const t = span > 0 ? (timeMs - a.timestampMs) / span : 0;
    return {
      longitude: a.longitude + (b.longitude - a.longitude) * t,
      latitude: a.latitude + (b.latitude - a.latitude) * t,
    };
  }

  return { longitude: last.longitude, latitude: last.latitude };
}

function formatWindow(timeMs: number | null, endMs: number): string {
  if (timeMs == null || !Number.isFinite(timeMs)) return '—';
  const d = new Date(timeMs);
  const timeStr = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
  const hoursBack = (endMs - timeMs) / 3_600_000;
  if (Math.abs(hoursBack) < 0.05) return `${timeStr} (At observation)`;
  if (hoursBack > 0) {
    if (hoursBack < 1) return `${timeStr} (${Math.round(hoursBack * 60)}m before)`;
    return `${timeStr} (${hoursBack.toFixed(1)}h before)`;
  }
  return timeStr;
}

/**
 * Play/scrub the investigation timeline across the oil drift and attribution window.
 * Authoritative simulation clock drives both oil drift position and vessel visual positions.
 *
 * NOTE: Vessel positions are interpolated on-the-fly for animation only;
 * no fake AIS observations are created or persisted.
 */
export function useInvestigationTimeline(
  trajectory: SpillTrajectory | null,
  vessels: AttributedVessel[],
  active: boolean,
  trajectoryWindow?: { start: string; startMs: number; end: string; endMs: number } | null
): UseInvestigationTimelineResult {
  const [progress, setProgressState] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Reset when the trajectory identity changes or backtrack turns off.
  useEffect(() => {
    setProgressState(active ? 0 : 1);
    setIsPlaying(false);
  }, [trajectory?.spillId, active]);

  const setProgress = useCallback((value: number) => {
    setProgressState(Math.min(1, Math.max(0, value)));
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  const hasAnimationSubject = Boolean(trajectory || vessels.length > 0);

  useEffect(() => {
    if (!isPlaying || !active || !hasAnimationSubject) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      return;
    }

    const tick = (now: number) => {
      const last = lastTsRef.current ?? now;
      lastTsRef.current = now;
      const delta = (now - last) / PLAY_DURATION_MS;

      setProgressState((prev) => {
        const next = prev + delta;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [isPlaying, active, hasAnimationSubject]);

  // Derive dynamic time boundaries from backend trajectoryWindow or data points
  const { startMs, endMs } = useMemo(() => {
    if (trajectoryWindow?.startMs && trajectoryWindow?.endMs) {
      return { startMs: trajectoryWindow.startMs, endMs: trajectoryWindow.endMs };
    }
    const trajStart = trajectory?.points[0]?.timestampMs ?? 0;
    const trajEnd = trajectory?.points[trajectory.points.length - 1]?.timestampMs ?? 0;
    if (trajStart && trajEnd) return { startMs: trajStart, endMs: trajEnd };

    // Fallback to vessels tracks
    let minMs = Number.POSITIVE_INFINITY;
    let maxMs = Number.NEGATIVE_INFINITY;
    for (const v of vessels) {
      for (const p of v.trajectory) {
        if (p.timestampMs < minMs) minMs = p.timestampMs;
        if (p.timestampMs > maxMs) maxMs = p.timestampMs;
      }
    }
    if (Number.isFinite(minMs) && Number.isFinite(maxMs) && maxMs > minMs) {
      return { startMs: minMs, endMs: maxMs };
    }
    return { startMs: trajStart, endMs: trajEnd };
  }, [trajectoryWindow, trajectory, vessels]);

  const currentTimeMs = useMemo(() => {
    if (!active || !hasAnimationSubject || startMs === 0 || endMs === 0) return null;
    return startMs + (endMs - startMs) * progress;
  }, [active, hasAnimationSubject, startMs, endMs, progress]);

  const oilPosition = useMemo(() => {
    if (!trajectory || currentTimeMs == null) return null;
    return interpolateOil(trajectory.points, currentTimeMs);
  }, [trajectory, currentTimeMs]);

  const visiblePoints = useMemo(() => {
    if (!trajectory) return [];
    if (!active || currentTimeMs == null) return trajectory.points;

    const clipped = trajectory.points.filter((p) => p.timestampMs <= currentTimeMs);
    if (clipped.length === 0) return [trajectory.points[0]];

    // Append the interpolated head so the path reaches the playhead smoothly.
    if (oilPosition) {
      const last = clipped[clipped.length - 1];
      if (
        Math.abs(last.longitude - oilPosition.longitude) > 1e-8 ||
        Math.abs(last.latitude - oilPosition.latitude) > 1e-8
      ) {
        return [
          ...clipped,
          {
            ...last,
            longitude: oilPosition.longitude,
            latitude: oilPosition.latitude,
            timestampMs: currentTimeMs,
            hoursBeforeDetection: (endMs - currentTimeMs) / 3_600_000,
          },
        ];
      }
    }
    return clipped;
  }, [trajectory, active, currentTimeMs, oilPosition, endMs]);

  const vesselPositions = useMemo(() => {
    if (!active || currentTimeMs == null) return [];
    const positions: TimelineVesselPosition[] = [];
    for (const vessel of vessels) {
      const pos = vesselPositionAt(vessel, currentTimeMs);
      if (!pos) continue;
      positions.push({
        vesselId: vessel.vesselId,
        rank: vessel.rank,
        vesselName: vessel.vesselName,
        isMock: vessel.isMock,
        longitude: pos.longitude,
        latitude: pos.latitude,
        heading: pos.heading,
      });
    }
    return positions;
  }, [active, vessels, currentTimeMs]);

  return {
    progress: active ? progress : 1,
    setProgress,
    isPlaying,
    play,
    pause,
    togglePlay,
    currentTimeMs,
    oilPosition,
    visiblePoints,
    vesselPositions,
    windowLabel: formatWindow(currentTimeMs, endMs),
  };
}
