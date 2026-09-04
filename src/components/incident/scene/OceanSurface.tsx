import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OceanVertexShader, OceanFragmentShader } from './shaders/OceanShader';
import { useSceneLayers } from '../../../context/SceneLayersContext';

/** Snap step — ocean mesh teleports in tile increments; waves use world space so it looks continuous. */
const OCEAN_SNAP = 64;
const OCEAN_SIZE = 5200;

export const OceanSurface: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { layers } = useSceneLayers();
  const segments = layers.lite ? 80 : 160;
  const waveStrength = layers.lite ? 0.14 : layers.night ? 0.22 : 0.36;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaveStrength: { value: 0.36 },
      uWorldOffset: { value: new THREE.Vector2(0, 0) },
      uColorDeep: { value: new THREE.Color('#0a4f86') },
      uColorMid: { value: new THREE.Color('#1a7ec4') },
      uColorSurface: { value: new THREE.Color('#6ec8ef') },
      uSunDirection: { value: new THREE.Vector3(0.45, 0.85, 0.35).normalize() },
      uSunColor: { value: new THREE.Color('#fff4d6') },
      uSunIntensity: { value: 1.55 },
    }),
    []
  );

  useFrame((state) => {
    const cam = state.camera.position;
    const snapX = Math.round(cam.x / OCEAN_SNAP) * OCEAN_SNAP;
    const snapZ = Math.round(cam.z / OCEAN_SNAP) * OCEAN_SNAP;

    if (meshRef.current) {
      meshRef.current.position.x = snapX;
      meshRef.current.position.z = snapZ;
    }

    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      u.uTime.value = state.clock.elapsedTime;
      u.uWaveStrength.value = waveStrength;
      u.uWorldOffset.value.set(snapX, snapZ);

      if (layers.night) {
        u.uColorDeep.value.set('#021428');
        u.uColorMid.value.set('#0a2f55');
        u.uColorSurface.value.set('#1a4a78');
        u.uSunDirection.value.set(-0.35, 0.25, -0.4).normalize();
        u.uSunColor.value.set('#9eb6ff');
        u.uSunIntensity.value = 0.55;
      } else {
        u.uColorDeep.value.set('#0a4f86');
        u.uColorMid.value.set('#1a7ec4');
        u.uColorSurface.value.set('#6ec8ef');
        u.uSunDirection.value.set(0.45, 0.85, 0.35).normalize();
        u.uSunColor.value.set('#fff4d6');
        u.uSunIntensity.value = 1.55;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      key={segments}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.05, 0]}
      frustumCulled={false}
    >
      <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={OceanVertexShader}
        fragmentShader={OceanFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite
      />
    </mesh>
  );
};
