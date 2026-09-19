// src/features/maritime-map/layers/shipMesh.ts
//
// A cargo-ship mesh for the vessel-reveal sequence's `SimpleMeshLayer`
// (`VesselInvestigationLayer.ts`), ported from the hand-rolled procedural
// geometry already in `public/3d-visualisation/app.js` (`hull()`, `box()`,
// `cylinder()`, and the `shipParts` composition) — per the brief: reuse the
// existing ship, don't source or model a new one.
//
// That app is a standalone raw-WebGL scene with its own render loop; there is
// no exported module or `.glb` asset to import, so this is a geometry port,
// not a reference. The primitive builders below are the same math, kept
// faithful vertex-for-vertex.
//
// Axis convention differs between the two scenes and is the one deliberate
// change: `app.js` is Y-up (X = hull length/bow-stern, Y = height, Z = beam/
// port-starboard) — a plain WebGL-scene convention. deck.gl's `SimpleMeshLayer`
// on a geographic (LNGLAT) map uses a Z-up ENU convention (X = east, Y =
// north, Z = up) for its meter-offset local space. `remap` swaps Y and Z on
// every vertex/normal so the SAME hull, unchanged, stands upright and points
// along local +X (east at yaw 0) instead of lying on its side.

export interface RawTriangles {
  positions: number[];
  normals: number[];
}

function remap(positions: number[]): Float32Array {
  const out = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    out[i] = positions[i]; // length axis unchanged
    out[i + 1] = positions[i + 2]; // beam (was Z) -> Y
    out[i + 2] = positions[i + 1]; // height (was Y) -> Z (up)
  }
  return out;
}

/** Axis-aligned box, ported 1:1 from `app.js`'s `box(x,y,z,w,h,d)`. */
function box(x: number, y: number, z: number, w: number, h: number, d: number): RawTriangles {
  const positions: number[] = [];
  const normals: number[] = [];
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const y0 = y;
  const y1 = y + h;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  const faces: [number[][], number[]][] = [
    [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]],
    [[[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]],
    [[[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0]],
    [[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]],
    [[[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0]],
    [[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]],
  ];
  for (const [quad, n] of faces) {
    for (const k of [0, 1, 2, 0, 2, 3]) {
      positions.push(...quad[k]);
      normals.push(...n);
    }
  }
  return { positions, normals };
}

/** Vertical cylinder, ported 1:1 from `app.js`'s `cylinder(x,y,z,r,h)`. */
function cylinder(x: number, y: number, z: number, r: number, h: number): RawTriangles {
  const positions: number[] = [];
  const normals: number[] = [];
  const segments = 20;
  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    const b = ((i + 1) / segments) * Math.PI * 2;
    const A = [x + Math.cos(a) * r, y, z + Math.sin(a) * r];
    const B = [x + Math.cos(b) * r, y, z + Math.sin(b) * r];
    const C = [A[0], y + h, A[2]];
    const D = [B[0], y + h, B[2]];
    for (const [v, t] of [[A, a], [B, b], [C, a], [C, a], [B, b], [D, b]] as [number[], number][]) {
      positions.push(...v);
      normals.push(Math.cos(t), 0, Math.sin(t));
    }
    for (const v of [[x, y + h, z], C, D]) {
      positions.push(...v);
      normals.push(0, 1, 0);
    }
  }
  return { positions, normals };
}

/** Tapered hull shell, ported 1:1 from `app.js`'s `hull()` (its `.body`, not the wireframe `.edge`). */
function hull(): RawTriangles {
  const shape: [number, number][] = [
    [-9, -2.2],
    [5.5, -2.2],
    [9.6, -0.8],
    [10.5, 0],
    [9.6, 0.8],
    [5.5, 2.2],
    [-9, 2.2],
  ];
  const positions: number[] = [];
  const normals: number[] = [];
  const normalize = (v: [number, number, number]): [number, number, number] => {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  };
  for (let i = 0; i < shape.length; i += 1) {
    const a = shape[i];
    const b = shape[(i + 1) % shape.length];
    const n = normalize([b[1] - a[1], 0, a[0] - b[0]]);
    const A = [a[0], 1.8, a[1]];
    const B = [b[0], 1.8, b[1]];
    const C = [a[0] * 0.9, -0.2, a[1] * 0.75];
    const D = [b[0] * 0.9, -0.2, b[1] * 0.75];
    for (const v of [A, B, C, C, B, D]) {
      positions.push(...v);
      normals.push(...n);
    }
    for (const v of [[0, 1.8, 0], A, B]) {
      positions.push(...v);
      normals.push(0, 1, 0);
    }
  }
  return { positions, normals };
}

/** Hull colour + the superstructure/bridge/funnel/container-stack parts, ported from `app.js`'s `shipParts`. */
function buildShipParts(): { geometry: RawTriangles; colorRgb01: [number, number, number, number] }[] {
  const parts: { geometry: RawTriangles; colorRgb01: [number, number, number, number] }[] = [
    { geometry: hull(), colorRgb01: [0.055, 0.29, 0.37, 1] },
    { geometry: box(-6, 1.8, 0, 4, 3.2, 3.8), colorRgb01: [0.35, 0.6, 0.66, 1] },
    { geometry: box(-6, 5, 0, 4.5, 1, 4.2), colorRgb01: [0.67, 0.83, 0.84, 1] },
    { geometry: box(-6, 5.2, 2.12, 3.5, 0.45, 0.06), colorRgb01: [0.015, 0.11, 0.16, 1] },
    { geometry: box(-6, 5.2, -2.12, 3.5, 0.45, 0.06), colorRgb01: [0.015, 0.11, 0.16, 1] },
    { geometry: box(-8, 3.7, 0, 1, 3, 1.2), colorRgb01: [0.15, 0.3, 0.36, 1] },
    { geometry: cylinder(-4.5, 6, 0, 0.13, 4), colorRgb01: [0.5, 0.83, 0.9, 1] },
    { geometry: box(-4.5, 8.3, 0, 0.15, 0.13, 4), colorRgb01: [0.42, 0.77, 0.84, 1] },
  ];
  for (const cx of [-1.5, 1.7, 4.9]) {
    parts.push({ geometry: cylinder(cx, 1.8, 0, 1.35, 1.3), colorRgb01: [0.25, 0.5, 0.54, 1] });
    parts.push({ geometry: box(cx, 3.1, 0, 0.8, 0.25, 0.8), colorRgb01: [0.48, 0.73, 0.72, 1] });
  }
  return parts;
}

export interface ShipMesh {
  attributes: {
    POSITION: { value: Float32Array; size: 3 };
    NORMAL: { value: Float32Array; size: 3 };
    COLOR: { value: Uint8Array; size: 4 };
  };
  /** Hull length along the local X (bow/stern) axis, in the same raw units as the mesh — for callers picking a `sizeScale`. */
  lengthUnits: number;
}

let cached: ShipMesh | null = null;

/**
 * Builds the combined ship mesh once and reuses it — the geometry is static
 * (only the `SimpleMeshLayer` instance's position/orientation/scale change
 * per vessel/frame), so there is no reason to rebuild these buffers on every
 * render.
 */
export function buildShipMesh(): ShipMesh {
  if (cached) return cached;

  const parts = buildShipParts();
  let vertexCount = 0;
  for (const part of parts) vertexCount += part.geometry.positions.length / 3;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Uint8Array(vertexCount * 4);

  let offset = 0;
  for (const part of parts) {
    const { positions: p, normals: n } = part.geometry;
    const count = p.length / 3;
    positions.set(p, offset * 3);
    normals.set(n, offset * 3);
    const [r, g, b, a] = part.colorRgb01;
    for (let i = 0; i < count; i += 1) {
      colors[(offset + i) * 4] = Math.round(r * 255);
      colors[(offset + i) * 4 + 1] = Math.round(g * 255);
      colors[(offset + i) * 4 + 2] = Math.round(b * 255);
      colors[(offset + i) * 4 + 3] = Math.round(a * 255);
    }
    offset += count;
  }

  const remappedPositions = remap(Array.from(positions));
  const remappedNormals = remap(Array.from(normals));

  cached = {
    attributes: {
      POSITION: { value: remappedPositions, size: 3 },
      NORMAL: { value: remappedNormals, size: 3 },
      COLOR: { value: colors, size: 4 },
    },
    // Bow (10.5) to stern (-9) on the hull's local X axis, before any remap.
    lengthUnits: 10.5 - -9,
  };
  return cached;
}
