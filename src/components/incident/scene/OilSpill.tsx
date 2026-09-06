import React, { useEffect, useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulation } from '../../../context/SimulationContext';
import { useInteraction } from '../../../pages/IncidentReconstructionPage';
import { latLonToWorld, METERS_PER_WORLD_UNIT } from '../../../utils/coordinates';
import { useIncident } from '../../../context/IncidentContext';
import { resolveTrajectoryPosition } from '../../../utils/trajectory';
import { oceanRuntime, sampleOceanSurface, type WaveSample } from '../../../systems/ocean';

const OIL_Y_BIAS = 0.14;
const OUTLINE_POINTS = 48;

function createIrregularOutline(radius: number): Float32Array {
  // Local XZ outline (y=0). Geographic X/Z stay fixed; only Y follows waves.
  const xz = new Float32Array((OUTLINE_POINTS + 1) * 2);
  for (let i = 0; i <= OUTLINE_POINTS; i++) {
    const t = (i / OUTLINE_POINTS) * Math.PI * 2;
    const wobble =
      0.72 +
      0.22 * Math.sin(t * 3.1) +
      0.14 * Math.cos(t * 5.4) +
      0.09 * Math.sin(t * 8.2 + 0.6);
    const x = Math.cos(t) * radius * wobble * 1.35;
    const z = Math.sin(t) * radius * wobble * 0.88;
    xz[i * 2] = x;
    xz[i * 2 + 1] = z;
  }
  return xz;
}

/** Fan-triangulated irregular oil patch with per-vertex wave height. */
function buildOilGeometry(outlineXZ: Float32Array): THREE.BufferGeometry {
  const n = outlineXZ.length / 2 - 1; // last point duplicates first
  const positions = new Float32Array((n + 1) * 3);
  // Center
  positions[0] = 0;
  positions[1] = 0;
  positions[2] = 0;
  for (let i = 0; i < n; i++) {
    positions[(i + 1) * 3] = outlineXZ[i * 2];
    positions[(i + 1) * 3 + 1] = 0;
    positions[(i + 1) * 3 + 2] = outlineXZ[i * 2 + 1];
  }

  const indices: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = 1 + i;
    const b = 1 + ((i + 1) % n);
    indices.push(0, a, b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export const OilSpill: React.FC = () => {
  const { progress, direction } = useSimulation();
  const { spillDetails, backtrackData } = useIncident();
  const { setSelectedObject } = useInteraction();
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const sheenRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(1);
  const waveScratch = useRef<WaveSample>({
    dx: 0,
    dz: 0,
    h: 0,
    nx: 0,
    ny: 1,
    nz: 0,
    height: 0,
  });

  const transform = useMemo(() => {
    const originLat =
      backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
    const originLon =
      backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

    let spillLat =
      backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
    let spillLon =
      backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

    if (backtrackData?.backtrack.trajectory && backtrackData.backtrack.trajectory.length > 0) {
      const startTimeMs = Date.parse(backtrackData.backtrack.estimated_release_time);
      const endTimeMs = Date.parse(backtrackData.backtrack.observation.timestamp);
      const resolvedPos = resolveTrajectoryPosition(
        backtrackData.backtrack.trajectory,
        progress,
        startTimeMs,
        endTimeMs,
        direction
      );
      if (resolvedPos) {
        spillLat = resolvedPos.latitude;
        spillLon = resolvedPos.longitude;
      }
    }

    const pos = latLonToWorld(spillLat, spillLon, originLat, originLon);

    const spread =
      direction === 'BACKTRACK' ? Math.max(0.28, 1 - progress * 0.72) : Math.max(0.28, 0.28 + progress * 0.72);

    const areaKm2 = spillDetails?.area_km2 ?? 2.5;
    const areaRadiusM = Math.sqrt((areaKm2 * 1_000_000) / Math.PI);
    const radiusMeters = Math.max(areaRadiusM, 900);
    const radiusUnits = Math.max((radiusMeters / METERS_PER_WORLD_UNIT) * spread, 10);

    const outlineXZ = createIrregularOutline(radiusUnits);
    const bodyGeometry = buildOilGeometry(outlineXZ);
    const sheenGeometry = bodyGeometry.clone();
    const haloGeometry = bodyGeometry.clone();
    // Rest-pose XZ for each vertex (index 0 = center)
    const restXZ = new Float32Array((OUTLINE_POINTS + 1) * 2);
    restXZ[0] = 0;
    restXZ[1] = 0;
    for (let i = 0; i < OUTLINE_POINTS; i++) {
      restXZ[(i + 1) * 2] = outlineXZ[i * 2];
      restXZ[(i + 1) * 2 + 1] = outlineXZ[i * 2 + 1];
    }

    return {
      pos,
      bodyGeometry,
      sheenGeometry,
      haloGeometry,
      restXZ,
      radiusUnits,
    };
  }, [progress, backtrackData, direction, spillDetails]);

  useEffect(() => {
    return () => {
      transform.bodyGeometry.dispose();
      transform.sheenGeometry.dispose();
      transform.haloGeometry.dispose();
    };
  }, [transform.bodyGeometry, transform.sheenGeometry, transform.haloGeometry]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    // Geographic X/Z from backend trajectory — never altered by waves.
    const baseX = transform.pos.x;
    const baseZ = transform.pos.z;
    group.position.x = baseX;
    group.position.z = baseZ;

    const cfg = oceanRuntime.config;
    const t = oceanRuntime.time;
    const scratch = waveScratch.current;

    // Center sample for group Y + subtle whole-patch tilt toward local normal
    const center = sampleOceanSurface(baseX, baseZ, t, cfg, scratch);
    group.position.y = center.h + OIL_Y_BIAS;

    const maxTilt = 0.22;
    const pitch = Math.max(-maxTilt, Math.min(maxTilt, Math.atan2(center.nz, Math.max(0.25, center.ny))));
    const roll = Math.max(-maxTilt, Math.min(maxTilt, Math.atan2(-center.nx, Math.max(0.25, center.ny))));
    group.rotation.x = pitch;
    group.rotation.z = roll;

    // Per-vertex Y: each outline point samples Gerstner at its world XZ
    const applyWaveToMesh = (mesh: THREE.Mesh | null, yBias: number) => {
      if (!mesh) return;
      const posAttr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const rest = transform.restXZ;
      const vertCount = rest.length / 2;
      for (let i = 0; i < vertCount; i++) {
        const lx = rest[i * 2];
        const lz = rest[i * 2 + 1];
        const wx = baseX + lx;
        const wz = baseZ + lz;
        const s = sampleOceanSurface(wx, wz, t, cfg, scratch);
        // Local Y relative to group (which already sits on center height)
        posAttr.setY(i, s.h - center.h + yBias);
      }
      posAttr.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    };

    applyWaveToMesh(bodyRef.current, 0.02);
    applyWaveToMesh(sheenRef.current, 0.03);
    applyWaveToMesh(haloRef.current, 0.01);

    // Soft pulse on halo scale
    pulseRef.current = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08;
    if (haloRef.current) {
      haloRef.current.scale.setScalar(1.32 * pulseRef.current);
    }
    if (rimRef.current) {
      rimRef.current.position.y = 0.04;
    }
  });

  const handlePointerDown = (e: any) => {
    clickStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    if (!clickStartRef.current) return;
    const dx = e.clientX - clickStartRef.current.x;
    const dy = e.clientY - clickStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      e.stopPropagation();
      setSelectedObject({
        type: 'oil',
        id: backtrackData?.spill_id ?? spillDetails?.spill_id ?? 'spill',
      });
    }
    clickStartRef.current = null;
  };

  return (
    <group
      ref={groupRef}
      position={[transform.pos.x, OIL_Y_BIAS, transform.pos.z]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Outer glow halo */}
      <mesh ref={haloRef} geometry={transform.haloGeometry} scale={[1.32, 1, 1.32]}>
        <meshBasicMaterial
          color="#ff3b30"
          transparent
          opacity={0.26}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dark oil body */}
      <mesh ref={bodyRef} geometry={transform.bodyGeometry}>
        <meshStandardMaterial
          color="#1a0a05"
          transparent
          opacity={0.92}
          roughness={0.35}
          metalness={0.55}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Reflective sheen / warm edge */}
      <mesh ref={sheenRef} geometry={transform.sheenGeometry} scale={[0.92, 1, 0.92]}>
        <meshStandardMaterial
          color="#c2410c"
          transparent
          opacity={0.48}
          roughness={0.2}
          metalness={0.75}
          emissive="#9a3412"
          emissiveIntensity={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Bright rim ring — follows center height via parent group */}
      <mesh ref={rimRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[transform.radiusUnits * 0.95, transform.radiusUnits * 1.12, 48]} />
        <meshBasicMaterial
          color="#ef4444"
          transparent
          opacity={0.82}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Compact anchor only — detailed spill stats live in the left incident panel */}
      <Html position={[0, 3.2, 0]} center zIndexRange={[90, 0]} distanceFactor={58}>
        <div className="pointer-events-none bg-red-950/80 border border-red-500/50 px-1.5 py-0.5 rounded backdrop-blur-sm shadow-[0_0_12px_rgba(239,68,68,0.4)]">
          <span className="text-[8px] text-red-300 font-bold tracking-widest whitespace-nowrap">
            OIL
          </span>
        </div>
      </Html>
    </group>
  );
};
