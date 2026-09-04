import React, { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { flowVectorToRotation } from '../../../../utils/coordinates';

interface CurrentIndicatorProps {
  u: number;
  v: number;
  speed: number;
}

export const CurrentIndicator: React.FC<CurrentIndicatorProps> = ({ u, v, speed }) => {
  const rotationY = flowVectorToRotation(u, v);
  
  const instances = useMemo(() => {
    const items = [];
    const spacing = 1.8;
    const gridRows = 6;
    const gridCols = 6;
    
    const offsetZ = ((gridRows - 1) * spacing) / 2;
    const offsetX = ((gridCols - 1) * spacing) / 2;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const staggerX = (r % 2) * (spacing / 2);
        const staggerZ = (c % 2) * (spacing / 3);
        const x = c * spacing - offsetX + staggerX;
        const z = r * spacing - offsetZ + staggerZ;
        const y = 0.35 + Math.random() * 0.1; 
        
        items.push({
          position: new THREE.Vector3(x, y, z),
          scale: 0.4 + Math.random() * 0.4
        });
      }
    }
    return items;
  }, []);

  if (speed === 0 && u === 0 && v === 0) return null;

  return (
    <group rotation={[0, rotationY, 0]}>
      <Instances limit={40}>
        <coneGeometry args={[0.05, 0.35, 4]} />
        <meshBasicMaterial 
          color="#22d3ee"
          transparent 
          opacity={0.5} 
          side={THREE.DoubleSide}
          depthWrite={false}
        />
        {instances.map((props, i) => (
          <Instance 
            key={i} 
            position={props.position} 
            rotation={[-Math.PI / 2, 0, 0]} 
            scale={props.scale} 
          />
        ))}
      </Instances>
    </group>
  );
};
