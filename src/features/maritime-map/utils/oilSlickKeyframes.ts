// src/features/maritime-map/utils/oilSlickKeyframes.ts
//
// Progress-agnostic keyframe construction + resolution for the "Focus Mode"
// oil-slick organic polygon. Pure functions only (no React, no rAF, no
// rendering) so they can be driven by ANY progress source.
//
// Extracted from the old useOilSpillFocusAnimation.ts, which used to own both
// this keyframe math AND its own independent requestAnimationFrame loop. The
// hook (and its standalone play/pause/backward/forward UI) has been removed;
// the polygon is now driven directly by InvestigationTimeline's existing
// progress/play state (see useInvestigationTimeline.ts). The math below is
// unchanged from the original hook — only the driver changed.

import * as turf from '@turf/turf';
import {
  generateOrganicPolygon,
  interpolateRadiusKm,
  interpolateRing,
  radiusFromAreaKm2,
} from './organicPolygon';

export interface OilSlickTrajectoryPoint {
  longitude: number;
  latitude: number;
  timestamp?: string;
}

export interface OilSlickKeyframe {
  ring: number[][];
}

/**
 * Matches InvestigationTimeline's `playbackMode`:
 *  - 'forward'  : progress 0 = origin,    1 = detection
 *  - 'backtrack': progress 0 = detection, 1 = origin
 */
export type OilSlickDirection = 'forward' | 'backtrack';

/**
 * Build one organic polygon keyframe per real trajectory point, oldest
 * (origin) first, newest (detection) last. Radius grows from
 * `sourceRadiusKm` (oldest point) to the detection-area-derived radius
 * (newest point) along an ease-out area curve. Precomputed once per
 * trajectory identity — never regenerated mid-animation, so the noise
 * perturbation never flickers frame to frame.
 *
 * Every keyframe — including the detection (last) one — uses the same
 * `generateOrganicPolygon` call. An earlier version of this module replaced
 * the detection-end keyframe with the real, authoritative detected polygon
 * (resampled to a fixed vertex count) so the traveling shape would land
 * exactly on it. That approach was abandoned: real detection polygons are
 * often low-vertex/near-rectangular, so the resample made the traveling
 * polygon visibly snap into a flat-edged shape right at the end instead of
 * staying organic. The handoff to the real shape is now done visually
 * instead — the traveling polygon fades out just before reaching detection,
 * revealing the pre-existing static authoritative-polygon layer underneath
 * (see `detectionHandoffOpacity` below and `DriftTrajectory.ts`'s
 * `updateFocusPolygon`) — so no keyframe ever needs to match the real shape.
 */
export function buildOilSlickKeyframes(
  points: OilSlickTrajectoryPoint[],
  sourceRadiusKm: number | null | undefined,
  detectionAreaKm2: number | null | undefined,
  seedKey: string,
  vertexCount: number
): OilSlickKeyframe[] {
  const n = points.length;
  const detectionRadiusKm = radiusFromAreaKm2(detectionAreaKm2);

  if (n === 1) {
    // The lone point is simultaneously origin and detection.
    const p = points[0];
    const radius = interpolateRadiusKm(sourceRadiusKm, detectionRadiusKm, 1);
    return [
      { ring: generateOrganicPolygon(p.longitude, p.latitude, radius, `${seedKey}:0`, vertexCount, null) },
    ];
  }

  return points.map((p, i) => {
    const t = i / (n - 1);
    const radius = interpolateRadiusKm(sourceRadiusKm, detectionRadiusKm, t);
    // No real current/wind vector is threaded into this module — derive the
    // slick's elongation direction from the trajectory itself (bearing from
    // the previous point to this one, or this point to the next one for the
    // very first keyframe), which approximates the drift direction well
    // enough to stretch the shape downstream instead of leaving it a blob.
    const bearingDeg = driftBearingForIndex(points, i);
    return {
      ring: generateOrganicPolygon(p.longitude, p.latitude, radius, `${seedKey}:${i}`, vertexCount, bearingDeg),
    };
  });
}

/** Bearing (compass degrees) from the previous trajectory point to this one, falling back to next->this for the first point. Null if it can't be determined (e.g. duplicate points). */
function driftBearingForIndex(points: OilSlickTrajectoryPoint[], i: number): number | null {
  const from = i > 0 ? points[i - 1] : points[i];
  const to = i > 0 ? points[i] : points[Math.min(i + 1, points.length - 1)];
  if (!from || !to || (from.longitude === to.longitude && from.latitude === to.latitude)) {
    return null;
  }
  return turf.bearing([from.longitude, from.latitude], [to.longitude, to.latitude]);
}

/** Locate the two bracketing keyframes for a 0..1 position and interpolate between them. */
export function resolveKeyframeAt(keyframes: OilSlickKeyframe[], u: number): number[][] {
  if (keyframes.length === 1) return keyframes[0].ring;

  const clamped = Math.min(1, Math.max(0, u));
  const scaled = clamped * (keyframes.length - 1);
  const idx = Math.floor(scaled);
  const localT = scaled - idx;

  if (idx >= keyframes.length - 1) return keyframes[keyframes.length - 1].ring;
  return interpolateRing(keyframes[idx].ring, keyframes[idx + 1].ring, localT);
}

/**
 * Resolve the interpolated ring for a given progress value (0..1) and
 * direction, using the SAME semantics InvestigationTimeline already uses for
 * its own playhead (see useInvestigationTimeline.ts's `currentTimeMs`
 * derivation):
 *
 *  - 'forward'  : progress 0 = origin (first keyframe)    -> 1 = detection (last keyframe). u = progress.
 *  - 'backtrack': progress 0 = detection (last keyframe)  -> 1 = origin (first keyframe).    u = 1 - progress.
 *
 * Returns null when there are no keyframes yet (e.g. trajectory still loading).
 */
export function resolvePolygonAtProgress(
  keyframes: OilSlickKeyframe[] | null,
  progress: number,
  direction: OilSlickDirection
): number[][] | null {
  if (!keyframes || keyframes.length === 0) return null;
  const u = direction === 'backtrack' ? 1 - progress : progress;
  return resolveKeyframeAt(keyframes, u);
}

// --- Detection handoff fade ------------------------------------------------
//
// The traveling polygon no longer morphs into the real detected shape (see
// `buildOilSlickKeyframes`'s docstring above for why that was abandoned).
// Instead it fades out right before reaching the detection keyframe, handing
// off visually to the pre-existing static authoritative-polygon layer
// (`SpillLayer.ts`'s `createSpillPolygonLayer`, rendered via deck.gl) that
// already sits at the correct real shape/location. `DriftTrajectory.ts`'s
// `updateFocusPolygon` multiplies its fill/line opacity by the value
// `detectionHandoffOpacity` returns below.

/**
 * Width of the fade window, in `progress` units, reserved at the detection
 * end of the trajectory — the last 8% of the approach to detection (and,
 * symmetrically, the first 8% of departure from detection in backtrack
 * mode). Small enough that the fade is barely noticeable while scrubbing
 * through the bulk of the animation, large enough (relative to a 12s base
 * play duration — see `PLAY_DURATION_MS` in useInvestigationTimeline.ts, ~1s
 * of that at 1x speed) to read as a deliberate dissolve rather than a pop.
 */
export const DETECTION_HANDOFF_THRESHOLD = 0.08;

/**
 * Distance (0..1) from the detection end of the trajectory — 0 exactly AT
 * detection, growing to 1 at the opposite (origin) end. Framed as a distance
 * (rather than proximity) so the fade window check below reads naturally as
 * "distance <= threshold".
 *
 * Mirrors (inverts) the `u` semantics `resolvePolygonAtProgress` uses
 * internally, which in turn matches useInvestigationTimeline.ts's own
 * `currentTimeMs` derivation:
 *  - 'forward'  : progress 1 = detection, so distance = 1 - progress.
 *  - 'backtrack': progress 0 = detection, so distance = progress.
 */
export function distanceFromDetection(progress: number, direction: OilSlickDirection): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return direction === 'forward' ? 1 - clamped : clamped;
}

/**
 * Smoothstep (Hermite) ease-in-out — zero slope at BOTH t=0 and t=1.
 *
 * Deliberately NOT reusing `easeOutCubic` (organicPolygon.ts) here: that
 * curve was designed for physical *growth* (radius/area easing out from a
 * fast start, see `interpolateRadiusKm`) and has a non-zero slope at t=0. For
 * an opacity fade that has to dovetail with a hard constant (multiplier ===
 * 1) outside the window on one side, and land exactly on 0 at detection on
 * the other, `easeOutCubic`'s nonzero slope at t=0 would make the traveling
 * polygon's opacity fall fastest in its very last instant — reading as an
 * abrupt snap right at the handoff instead of a dissolve. Smoothstep's zero
 * slope at both ends removes the kink where the window meets the "always 1"
 * plateau, and lets opacity settle into/out of 0 gently instead of snapping.
 */
function easeInOutFade(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Opacity multiplier (0..1) for the TRAVELING focus polygon
 * (`DriftTrajectory.ts`'s `drift-focus-fill`/`drift-focus-outline` layers),
 * given the investigation timeline's own `progress` + `direction`.
 *
 * - Outside the handoff window (distance > `DETECTION_HANDOFF_THRESHOLD`):
 *   1 — completely unaffected, identical to the pre-fade behavior.
 * - Inside it: eased from 0 (exactly at detection) up to 1 (at the window's
 *   outer edge), so the traveling shape dissolves into the static
 *   authoritative layer underneath instead of the two ever rendering
 *   simultaneously at full strength.
 *
 * Backtrack's progress 0 IS the detection point, so `distanceFromDetection`
 * is already 0 there — backtrack therefore starts already fully faded out
 * (opacity 0) and fades in as it departs, with no special-casing needed.
 *
 * Pure function of (progress, direction) only — no `isPlaying`/rAF
 * dependency — so it produces identical output whether `progress` is driven
 * by the play loop or a manual slider drag, since both ultimately just set
 * the same `progress` number this function reads fresh on every render (see
 * MaritimeMap.tsx).
 */
export function detectionHandoffOpacity(progress: number, direction: OilSlickDirection): number {
  const distance = distanceFromDetection(progress, direction);
  if (distance > DETECTION_HANDOFF_THRESHOLD) return 1;
  const fadeFactor = distance / DETECTION_HANDOFF_THRESHOLD;
  return easeInOutFade(fadeFactor);
}
