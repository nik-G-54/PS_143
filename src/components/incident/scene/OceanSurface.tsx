import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OceanVertexShader, OceanFragmentShader } from './shaders/OceanShader';
import { useSceneLayers } from '../../../context/SceneLayersContext';

export const OceanSurface: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { layers } = useSceneLayers();
  const segments = layers.lite ? 96 : 200;
  const waveStrength = layers.lite ? 0.06 : 0.2;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveStrength: { value: 0.2 },
    uColorDeep: { value: new THREE.Color('#0a4f86') },
    uColorMid: { value: new THREE.Color('#1a7ec4') },
    uColorSurface: { value: new THREE.Color('#6ec8ef') },
    uSunDirection: { value: new THREE.Vector3(0.45, 0.85, 0.35).normalize() },
    uSunColor: { value: new THREE.Color('#fff4d6') },
    uSunIntensity: { value: 1.45 }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uWaveStrength.value = waveStrength;
    }
  });

  return (
    <mesh key={segments} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[600, 600, segments, segments]} />
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
