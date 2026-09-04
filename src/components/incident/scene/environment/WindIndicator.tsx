import React, { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { flowVectorToRotation } from '../../../../utils/coordinates';

interface WindIndicatorProps {
  u: number;
  v: number;
  speed: number;
}

export const WindIndicator: React.FC<WindIndicatorProps> = ({ u, v, speed }) => {
  const rotationY = flowVectorToRotation(u, v);
  
  const instances = useMemo(() => {
    const items = [];
    const spacing = 3.5;
    const gridRows = 3;
    const gridCols = 4;
    
    const offsetZ = ((gridRows - 1) * spacing) / 2;
    const offsetX = ((gridCols - 1) * spacing) / 2;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const staggerX = (r % 2) * (spacing / 2);
        const x = c * spacing - offsetX + staggerX;
        const z = r * spacing - offsetZ;
        const y = 1.2 + Math.random() * 0.3; 
        
        items.push({
          position: new THREE.Vector3(x, y, z),
          scale: 0.7 + Math.random() * 0.3
        });
      }
    }
    return items;
  }, []);

  if (speed === 0 && u === 0 && v === 0) return null;

  return (
    <group rotation={[0, rotationY, 0]}>
      <Instances limit={20}>
        <coneGeometry args={[0.1, 1.0, 3]} />
        <meshBasicMaterial 
          color="#7dd3fc"
          transparent 
          opacity={0.25} 
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
