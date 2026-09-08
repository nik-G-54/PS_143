import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneLayers } from '../../../context/SceneLayersContext';
import { useIncident } from '../../../context/IncidentContext';
import {
  applyOceanControlOverrides,
  useOceanControlsOptional,
} from '../../../context/OceanControlsContext';
import {
  OceanVertexShader,
  OceanFragmentShader,
  environmentToOceanConfig,
  oceanRuntime,
  type OceanConfig,
} from '../../../systems/ocean';

/** Snap step — ocean mesh teleports in tile increments; waves use world space so it looks continuous. */
const OCEAN_SIZE = 5200;

function applyConfigToUniforms(
  uniforms: Record<string, { value: unknown }>,
  config: OceanConfig,
  night: boolean
) {
  const u = uniforms;
  (u.uWindDir.value as THREE.Vector2).set(config.waveDirection.x, config.waveDirection.z);
  u.uWaveCount.value = config.waveCount;
  u.uBaseFreq.value = config.waveFrequency;
  u.uAmplitude.value = config.waveAmplitude;
  u.uChoppy.value = config.waveSteepness;
  u.uDirSpread.value = config.dirSpread;
  u.uFreqMul.value = config.freqMul;
  u.uAmpMul.value = config.ampMul;
  u.uSpeed.value = config.waveSpeed;
  u.uSurfaceY.value = config.surfaceY;
  u.uDetailScale.value = config.detailScale;
  u.uDetailStrength.value = config.detailStrength;
  u.uRoughness.value = config.roughness;
  u.uSSSStrength.value = config.sssStrength;
  u.uFoamThreshold.value = config.foamThreshold;
  u.uFoamSoftness.value = config.foamSoftness;
  u.uCrestFoamStart.value = config.crestFoamStart;
  u.uFoamCoverage.value = config.foamCoverage;
  u.uFoamEdge.value = config.foamEdge;
  u.uFoamOpacity.value = config.foamOpacity;
  (u.uDeepColor.value as THREE.Color).set(config.deepColor);
  (u.uShallowColor.value as THREE.Color).set(config.shallowColor);
  (u.uFoamColor.value as THREE.Color).set(config.foamColor);
  (u.uSSSColor.value as THREE.Color).set(config.sssColor);
  u.uNight.value = night ? 1 : 0;
  u.uCloudCover.value = night ? 0.25 : 0.55;
}

export const OceanSurface: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { layers } = useSceneLayers();
  const { environment } = useIncident();
  const oceanControls = useOceanControlsOptional();
  const segments = layers.lite ? 96 : 180;
  const cell = OCEAN_SIZE / segments;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.45, 0.85, 0.35).normalize() },
      uWindDir: { value: new THREE.Vector2(1, 0.35).normalize() },
      uWaveCount: { value: 18 },
      uBaseFreq: { value: (2 * Math.PI) / 95 },
      uAmplitude: { value: 0.48 },
      uChoppy: { value: 0.55 },
      uDirSpread: { value: 0.9 },
      uFreqMul: { value: 1.19 },
      uAmpMul: { value: 0.82 },
      uSpeed: { value: 1.0 },
      uSurfaceY: { value: 0 },
      uDetailScale: { value: 0.28 },
      uDetailStrength: { value: 0.12 },
      uRoughness: { value: 0.09 },
      uCloudCover: { value: 0.55 },
      uSSSStrength: { value: 0.28 },
      uFoamThreshold: { value: 0.22 },
      uFoamSoftness: { value: 0.4 },
      uCrestFoamStart: { value: 0.55 },
      uFoamCoverage: { value: 0.85 },
      uFoamEdge: { value: 0.22 },
      uFoamOpacity: { value: 0.9 },
      uDeepColor: { value: new THREE.Color('#001a33') },
      uShallowColor: { value: new THREE.Color('#0a6b7a') },
      uFoamColor: { value: new THREE.Color('#f2f8fc') },
      uSSSColor: { value: new THREE.Color('#1a8578') },
      uNight: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    const cam = state.camera.position;
    const snapX = Math.round(cam.x / cell) * cell;
    const snapZ = Math.round(cam.z / cell) * cell;

    if (meshRef.current) {
      meshRef.current.position.x = snapX;
      meshRef.current.position.z = snapZ;
    }

    const baseConfig = environmentToOceanConfig(environment, {
      lite: layers.lite,
      night: layers.night,
    });
    const config =
      oceanControls != null
        ? applyOceanControlOverrides(baseConfig, oceanControls.controls, oceanControls.enabled)
        : baseConfig;

    // Visual wave clock only — SimulationContext remains the logical timeline.
    oceanRuntime.setFrame(state.clock.elapsedTime, config);

    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      u.uTime.value = state.clock.elapsedTime;
      applyConfigToUniforms(u, config, layers.night);

      if (layers.night) {
        u.uSunDir.value.set(-0.35, 0.28, -0.4).normalize();
      } else {
        u.uSunDir.value.set(0.45, 0.85, 0.35).normalize();
      }
    }
  });

  // PlaneGeometry is XZ after rotateX(-π/2) — matches WaterThreeJS Ocean mesh orientation.
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(OCEAN_SIZE, OCEAN_SIZE, segments, segments);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [segments]);

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={OceanVertexShader}
        fragmentShader={OceanFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        depthWrite
        toneMapped
      />
    </mesh>
  );
};
