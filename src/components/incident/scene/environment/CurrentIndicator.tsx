import React, { useMemo, useRef } from 'react';
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { flowVectorToRotation } from '../../../../utils/coordinates';

interface CurrentIndicatorProps {
  u: number;
  v: number;
  speed: number;
  directionDeg?: number;
}

function cardinal(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** Surface current ribbons — soft flowing curves near the water. */
export const CurrentIndicator: React.FC<CurrentIndicatorProps> = ({
  u,
  v,
  speed,
  directionDeg,
}) => {
  const rotationY = flowVectorToRotation(u, v);
  const deg = directionDeg ?? ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
  const groupRef = useRef<THREE.Group>(null);

  const ribbons = useMemo(() => {
    const items: {
      points: THREE.Vector3[];
      opacity: number;
      phase: number;
    }[] = [];
    const spacing = 5.5;
    const rows = 5;
    const cols = 7;
    const len = 3.2 + Math.min(speed * 4, 3);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const stagger = (r % 2) * (spacing * 0.4);
        const x = c * spacing - ((cols - 1) * spacing) / 2 + stagger + 4 + (Math.random() - 0.5);
        const z = r * spacing - ((rows - 1) * spacing) / 2 + 8 + (Math.random() - 0.5);
        const y = 0.35 + Math.random() * 0.2;
        const curve = 0.4 + Math.random() * 0.5;
        items.push({
          points: [
            new THREE.Vector3(x - curve, y, z + len * 0.5),
            new THREE.Vector3(x + curve * 0.3, y, z),
            new THREE.Vector3(x - curve * 0.2, y, z - len * 0.5),
          ],
          opacity: 0.4 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    return items;
  }, [speed]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if (i >= ribbons.length) return;
      child.position.z = Math.sin(t * 0.85 + ribbons[i].phase) * 0.35;
    });
  });

  if (speed === 0 && u === 0 && v === 0) return null;

  return (
    <group rotation={[0, rotationY, 0]}>
      <group ref={groupRef}>
        {ribbons.map((s, i) => (
          <group key={i}>
            <Line
              points={s.points}
              color="#67e8f9"
              lineWidth={1.25}
              transparent
              opacity={s.opacity}
            />
            <mesh
              position={[s.points[2].x, s.points[2].y, s.points[2].z - 0.1]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <coneGeometry args={[0.12, 0.4, 3]} />
              <meshBasicMaterial
                color="#22d3ee"
                transparent
                opacity={s.opacity + 0.1}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      <Html position={[-11, 2.4, 14]} center zIndexRange={[70, 0]} distanceFactor={48}>
        <div className="pointer-events-none rounded border border-cyan-400/45 bg-slate-950/85 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="text-[8px] font-bold tracking-[0.18em] text-cyan-400">CURRENT</div>
          <div className="mt-0.5 font-mono text-[11px] font-semibold text-cyan-100 whitespace-nowrap">
            {speed.toFixed(2)} m/s · {cardinal(deg)}
          </div>
        </div>
      </Html>
    </group>
  );
};
