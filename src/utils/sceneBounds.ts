import * as THREE from 'three';
import { latLonToWorld } from './coordinates';
import type { BacktrackResponse, VesselCandidate } from '../types/api';
import {
  CAMERA_FRAME_DIRECTION,
  CAMERA_FRAME_PADDING,
  CAMERA_MAX_FRAME_RADIUS,
  CAMERA_MIN_FRAME_RADIUS,
} from '../config/reconstructionViz';

export interface SceneBounds {
  center: THREE.Vector3;
  radius: number;
  pointCount: number;
}

type LatLon = { latitude: number; longitude: number };

function pushLatLon(
  out: THREE.Vector3[],
  lat: number,
  lon: number,
  originLat: number,
  originLon: number
) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  const p = latLonToWorld(lat, lon, originLat, originLon);
  out.push(new THREE.Vector3(p.x, 0, p.z));
}

function pushTrack(
  out: THREE.Vector3[],
  track: Array<LatLon | { lat?: number; lng?: number }> | undefined,
  originLat: number,
  originLon: number
) {
  if (!track) return;
  for (const pt of track) {
    const lat = 'latitude' in pt ? pt.latitude : pt.lat;
    const lon = 'longitude' in pt ? pt.longitude : pt.lng;
    if (typeof lat === 'number' && typeof lon === 'number') {
      pushLatLon(out, lat, lon, originLat, originLon);
    }
  }
}

/**
 * Collects world-space points for all reconstruction anchors from backend data.
 * Coordinates are projected only — never scaled or stretched.
 */
export function collectReconstructionPoints(
  backtrackData: BacktrackResponse | null | undefined,
  spillDetails: { centroid?: LatLon } | null | undefined,
  vessels: VesselCandidate[] | undefined
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  const originLat =
    backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon =
    backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  // Observation / spill centroid
  pushLatLon(points, originLat, originLon, originLat, originLon);

  if (spillDetails?.centroid) {
    pushLatLon(
      points,
      spillDetails.centroid.latitude,
      spillDetails.centroid.longitude,
      originLat,
      originLon
    );
  }

  // Oil trajectory
  pushTrack(points, backtrackData?.backtrack.trajectory, originLat, originLon);

  // Source estimate (+ approximate radius ring samples for framing)
  const source = backtrackData?.backtrack.source_estimate;
  if (source) {
    pushLatLon(points, source.latitude, source.longitude, originLat, originLon);
    if (typeof source.radius_km === 'number' && source.radius_km > 0) {
      const radiusM = source.radius_km * 1000;
      const metersPerDegLat = 111_320;
      const metersPerDegLon = metersPerDegLat * Math.cos(originLat * (Math.PI / 180));
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        pushLatLon(
          points,
          source.latitude + (Math.cos(a) * radiusM) / metersPerDegLat,
          source.longitude + (Math.sin(a) * radiusM) / metersPerDegLon,
          originLat,
          originLon
        );
      }
    }
  }

  // Vessel tracks + culprit / release proximity markers
  for (const vessel of vessels ?? []) {
    pushTrack(points, vessel.track, originLat, originLon);
    if (vessel.culprit_location) {
      pushLatLon(
        points,
        vessel.culprit_location.latitude,
        vessel.culprit_location.longitude,
        originLat,
        originLon
      );
    }
  }

  return points;
}

export function computeSceneBounds(points: THREE.Vector3[]): SceneBounds | null {
  if (points.length === 0) return null;

  const box = new THREE.Box3().setFromPoints(points);
  const center = new THREE.Vector3();
  box.getCenter(center);
  center.y = 0;

  let radius = 0;
  for (const p of points) {
    radius = Math.max(radius, p.distanceTo(center));
  }

  // Also consider box half-diagonal so elongated paths aren't clipped
  const size = new THREE.Vector3();
  box.getSize(size);
  const halfDiag = 0.5 * Math.sqrt(size.x * size.x + size.z * size.z);
  radius = Math.max(radius, halfDiag, CAMERA_MIN_FRAME_RADIUS * 0.35);
  radius = Math.min(Math.max(radius, CAMERA_MIN_FRAME_RADIUS), CAMERA_MAX_FRAME_RADIUS);

  return { center, radius, pointCount: points.length };
}

export interface FramedCameraPose {
  position: [number, number, number];
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
}

/** Stable overview pose that fits the reconstruction with visual padding. Never follows moving objects. */
export function computeFramedCameraPose(
  bounds: SceneBounds,
  fovDeg = 48,
  padding = CAMERA_FRAME_PADDING
): FramedCameraPose {
  const paddedRadius = bounds.radius * (1 + padding);
  const fov = (fovDeg * Math.PI) / 180;
  // Fit sphere in vertical FOV with a little extra for HUD chrome
  const distance = Math.max(
    (paddedRadius / Math.sin(fov / 2)) * 1.05,
    CAMERA_MIN_FRAME_RADIUS * 1.8
  );

  const dir = new THREE.Vector3(
    CAMERA_FRAME_DIRECTION.x,
    CAMERA_FRAME_DIRECTION.y,
    CAMERA_FRAME_DIRECTION.z
  ).normalize();

  const position = bounds.center.clone().addScaledVector(dir, distance);

  return {
    position: [position.x, position.y, position.z],
    target: [bounds.center.x, 0.5, bounds.center.z],
    minDistance: Math.max(8, paddedRadius * 0.35),
    maxDistance: Math.max(distance * 3.5, 800),
  };
}
