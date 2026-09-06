import React, { useMemo, useRef } from 'react';
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { flowVectorToRotation } from '../../../../utils/coordinates';

interface WindIndicatorProps {
  u: number;
  v: number;
  speed: number;
  directionDeg?: number;
}

function toKnots(mps: number) {
  return mps * 1.94384;
}

function cardinal(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** Soft animated wind streaks (not cone dots). */
export const WindIndicator: React.FC<WindIndicatorProps> = ({ u, v, speed, directionDeg }) => {
  const rotationY = flowVectorToRotation(u, v);
  const deg = directionDeg ?? ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
  const groupRef = useRef<THREE.Group>(null);

  const streaks = useMemo(() => {
    const items: {
      points: THREE.Vector3[];
      opacity: number;
      phase: number;
    }[] = [];
    const spacing = 11;
    const rows = 4;
    const cols = 6;
    const len = 4.5 + Math.min(speed, 8) * 0.35;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const stagger = (r % 2) * (spacing * 0.45);
        const x = c * spacing - ((cols - 1) * spacing) / 2 + stagger + (Math.random() - 0.5) * 2;
        const z = r * spacing - ((rows - 1) * spacing) / 2 - 6 + (Math.random() - 0.5) * 2;
        const y = 2.8 + Math.random() * 1.4;
        // Streak along local -Z (forward after group rotation)
        items.push({
          points: [
            new THREE.Vector3(x, y, z + len * 0.5),
            new THREE.Vector3(x * 0.98, y + 0.15, z),
            new THREE.Vector3(x, y, z - len * 0.5),
          ],
          opacity: 0.35 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    return items;
  }, [speed]);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Subtle bob so streaks feel alive
    groupRef.current.children.forEach((child, i) => {
      if (i >= streaks.length) return;
      const phase = streaks[i].phase;
      child.position.y = Math.sin(state.clock.elapsedTime * 1.1 + phase) * 0.25;
    });
  });

  if (speed === 0 && u === 0 && v === 0) return null;

  return (
    <group rotation={[0, rotationY, 0]}>
      <group ref={groupRef}>
        {streaks.map((s, i) => (
          <group key={i}>
            <Line
              points={s.points}
              color="#fde047"
              lineWidth={1.5}
              transparent
              opacity={s.opacity}
            />
            {/* Tiny arrow tip */}
            <mesh
              position={[s.points[2].x, s.points[2].y, s.points[2].z - 0.15]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <coneGeometry args={[0.18, 0.55, 3]} />
              <meshBasicMaterial
                color="#facc15"
                transparent
                opacity={s.opacity + 0.15}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      <Html position={[16, 5.5, -8]} center zIndexRange={[70, 0]} distanceFactor={48}>
        <div className="pointer-events-none rounded border border-yellow-400/45 bg-slate-950/85 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="text-[8px] font-bold tracking-[0.18em] text-yellow-400">WIND</div>
          <div className="mt-0.5 font-mono text-[11px] font-semibold text-yellow-100 whitespace-nowrap">
            {toKnots(speed).toFixed(1)} kn · {cardinal(deg)}
          </div>
        </div>
      </Html>
    </group>
  );
};
