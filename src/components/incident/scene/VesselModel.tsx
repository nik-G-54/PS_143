import React from 'react';
import { Html } from '@react-three/drei';

interface VesselModelProps {
  position: [number, number, number];
  heading: number; // Geographic heading in degrees (0 = North, 90 = East)
  id: string;
  status: string;
}

export const VesselModel: React.FC<VesselModelProps> = ({ position, heading, id, status }) => {
  // Convert geographic heading to Three.js rotation
  // Assuming the model points along -Z (North) initially.
  // Geographic heading is clockwise, Three.js Y-rotation is counter-clockwise.
  const rotationY = -heading * (Math.PI / 180);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* --- Simple Procedural Vessel Geometry --- */}
      
      {/* Main Hull */}
      <mesh position={[0, 0.5, 0]}>
        {/* width (X), height (Y), depth/length (Z) */}
        <boxGeometry args={[1.5, 1, 6]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Bow (Front of the hull, pointing -Z) */}
      <mesh position={[0, 0.5, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
        {/* A simple wedge shape using cylinder/cone or just a smaller box for now */}
        <coneGeometry args={[0.75, 1, 4]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Bridge / Superstructure (Back of the ship, +Z) */}
      <mesh position={[0, 1.5, 2]}>
        <boxGeometry args={[1.2, 1, 1.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.5} />
      </mesh>
      
      {/* Funnel / Stack */}
      <mesh position={[0, 2.25, 2.3]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 8]} />
        <meshStandardMaterial color="#ef4444" roughness={0.8} />
      </mesh>

      {/* --- Vessel Label (HUD) --- */}
      {/* We undo the ship's Y rotation for the HTML label so it doesn't spin with the ship */}
      <group rotation={[0, -rotationY, 0]}>
        <Html position={[0, 4, 0]} center zIndexRange={[100, 0]} distanceFactor={40}>
          <div className="bg-slate-900/80 border border-cyan-500/50 px-2 py-1 rounded flex flex-col items-center pointer-events-none backdrop-blur-sm shadow-[0_0_10px_rgba(8,145,178,0.3)]">
            <span className="text-[10px] text-cyan-300 font-mono font-bold tracking-widest whitespace-nowrap">{id}</span>
            <span className="text-[8px] text-slate-400 font-mono tracking-widest">{status}</span>
          </div>
        </Html>
      </group>
    </group>
  );
};
