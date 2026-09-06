import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SpillTrajectory } from '../types/trajectoryTypes';
import type { AttributedVessel } from '../types/attributionTypes';
import { vesselPositionAt } from '../adapters/vesselAdapter';

export type PlaybackMode = 'forward' | 'backtrack';

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
  /** 0 = start of the current mode, 1 = end of the current mode. */
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
  /** True when backtrack mode has reached 100% (vessel at probable source). */
  atSource: boolean;
  playbackMode: PlaybackMode;
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

function formatWindow(
  timeMs: number | null,
  startMs: number,
  endMs: number,
  mode: PlaybackMode
): string {
  if (timeMs == null || !Number.isFinite(timeMs)) return '—';
  if (mode === 'forward') {
    const hoursIn = (timeMs - startMs) / 3_600_000;
    if (hoursIn < 0.05) return 'At origin';
    if (hoursIn < 1) return `${Math.round(hoursIn * 60)} min from origin`;
    return `${hoursIn.toFixed(1)} h from origin`;
  }
  // backtrack: label relative to detection (end of trajectory)
  const hoursBack = (endMs - timeMs) / 3_600_000;
  if (hoursBack < 0.05) return 'At detection';
  if (hoursBack < 1) return `${Math.round(hoursBack * 60)} min before detection`;
  return `${hoursBack.toFixed(1)} h before detection`;
}

/**
 * Play/scrub the investigation timeline across the oil drift window.
 *
 * Supports two modes:
 *   - 'forward'  : progress 0 = origin/release, 1 = detection  (Past → Present)
 *   - 'backtrack': progress 0 = detection,       1 = origin      (Present → Past)
 *
 * Oil, vessel positions and timeline all derive from the same `currentTimeMs`
 * so every layer stays in sync regardless of mode.
 */
export function useInvestigationTimeline(
  trajectory: SpillTrajectory | null,
  vessels: AttributedVessel[],
  active: boolean,
  playbackMode: PlaybackMode = 'forward'
): UseInvestigationTimelineResult {
  const [progress, setProgressState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Reset whenever trajectory identity, mode, or active state changes.
  useEffect(() => {
    setProgressState(0);
    setIsPlaying(false);
  }, [trajectory?.spillId, active, playbackMode]);

  const setProgress = useCallback((value: number) => {
    setProgressState(Math.min(1, Math.max(0, value)));
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  useEffect(() => {
    if (!isPlaying || !active || !trajectory) {
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
  }, [isPlaying, active, trajectory]);

  const startMs = trajectory?.points[0]?.timestampMs ?? 0;
  const endMs = trajectory?.points[trajectory.points.length - 1]?.timestampMs ?? 0;

  const currentTimeMs = useMemo(() => {
    if (!trajectory || !active) return null;
    if (playbackMode === 'backtrack') {
      // Backtrack: progress 0 = detection (endMs), progress 1 = origin (startMs)
      return endMs - (endMs - startMs) * progress;
    }
    // Forward: progress 0 = origin (startMs), progress 1 = detection (endMs)
    return startMs + (endMs - startMs) * progress;
  }, [trajectory, active, startMs, endMs, progress, playbackMode]);

  const oilPosition = useMemo(() => {
    if (!trajectory || currentTimeMs == null) return null;
    return interpolateOil(trajectory.points, currentTimeMs);
  }, [trajectory, currentTimeMs]);

  const visiblePoints = useMemo(() => {
    if (!trajectory) return [];
    if (!active || currentTimeMs == null) return trajectory.points;

    // Always clip from oldest (startMs) up to currentTimeMs.
    // In forward mode this grows the path. In backtrack mode the ghost full-path
    // layer (in TrajectoryLayer.ts) shows the complete reference track while
    // visiblePoints shows what has already been "visited" up to the rewinding head.
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

  // "Vessel at probable source" milestone — backtrack has reached the origin end.
  const atSource = playbackMode === 'backtrack' && active && progress >= 0.98;

  return {
    progress: active ? progress : 0,
    setProgress,
    isPlaying,
    play,
    pause,
    togglePlay,
    currentTimeMs,
    oilPosition,
    visiblePoints,
    vesselPositions,
    windowLabel: formatWindow(currentTimeMs, startMs, endMs, playbackMode),
    atSource,
    playbackMode,
  };
}
