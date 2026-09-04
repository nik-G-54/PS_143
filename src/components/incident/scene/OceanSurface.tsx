import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OceanVertexShader, OceanFragmentShader } from './shaders/OceanShader';

export const OceanSurface: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveStrength: { value: 0.12 },
    // Deep abyss color - matches the atmospheric fog for a seamless horizon
    uColorDeep: { value: new THREE.Color('#071524') },
    // Mid-tone 
    uColorMid: { value: new THREE.Color('#0c2438') },
    // Surface/crest highlight 
    uColorSurface: { value: new THREE.Color('#163e5c') },
    // Low-angle sun from slight elevation for nighttime maritime feel
    uSunDirection: { value: new THREE.Vector3(0.3, 0.4, 0.6).normalize() },
    // Cool blue-white sun for night/dusk mood
    uSunColor: { value: new THREE.Color('#c9e1f5') },
    uSunIntensity: { value: 0.8 }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      {/* 600x600 world units, 200x200 segments for smooth wave displacement */}
      <planeGeometry args={[600, 600, 200, 200]} />
      <shaderMaterial 
        ref={materialRef}
        vertexShader={OceanVertexShader}
        fragmentShader={OceanFragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={true}
      />
    </mesh>
  );
};
