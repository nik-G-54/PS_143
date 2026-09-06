/**
 * Visualization-only knobs for the 3D incident reconstruction.
 * Does not alter backend coordinates, timestamps, or attribution data.
 */

/** Default wall-clock duration for a full timeline playback (~16h history → ~75s). */
export const RECONSTRUCTION_PLAYBACK_DURATION_MS = 75_000;

/** Extra margin around the geographic bounding sphere (0.25 = 25% padding). */
export const CAMERA_FRAME_PADDING = 0.28;

/** Minimum framing radius in world units so tiny clusters are still readable. */
export const CAMERA_MIN_FRAME_RADIUS = 28;

/** Maximum framing radius — keeps very large scenes from pulling the camera too far. */
export const CAMERA_MAX_FRAME_RADIUS = 420;

/** Elevated oblique look direction (scene space) for overview framing. */
export const CAMERA_FRAME_DIRECTION = { x: 0.52, y: 0.48, z: 0.72 } as const;

/** Oil trajectory visual weight (line widths for drei Line). */
export const OIL_TRAJECTORY_LINE_WIDTH = 4.5;
export const OIL_TRAJECTORY_GLOW_WIDTH = 9;

/** Vessel AIS track visual weights. */
export const AIS_PRIMARY_LINE_WIDTH = 2.8;
export const AIS_SECONDARY_LINE_WIDTH = 1.2;
export const AIS_SECONDARY_OPACITY = 0.32;
