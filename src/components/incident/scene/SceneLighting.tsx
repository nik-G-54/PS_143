import React from 'react';
import { Sky } from '@react-three/drei';
import { useSceneLayers } from '../../../context/SceneLayersContext';

export const SceneLighting: React.FC = () => {
  const { layers } = useSceneLayers();
  const night = layers.night;

  // Sun positions aligned with OceanSurface uSunDir (day / night).
  if (night) {
    return (
      <>
        <ambientLight intensity={0.22} color="#6b7c9c" />
        <directionalLight position={[-35, 28, -40]} intensity={0.35} color="#c5d4ff" />
        <hemisphereLight color="#1a2740" groundColor="#020810" intensity={0.35} />
        <pointLight position={[20, 8, 15]} intensity={0.45} color="#4ea8ff" distance={200} />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.85} color="#8ec8ea" />
      <directionalLight position={[45, 85, 35]} intensity={1.6} color="#fff4d6" castShadow />
      <hemisphereLight color="#d7f0ff" groundColor="#0a4f86" intensity={0.55} />
    </>
  );
};

export const SceneAtmosphere: React.FC = () => {
  const { layers } = useSceneLayers();
  const night = layers.night;

  if (night) {
    return (
      <Sky
        distance={450000}
        sunPosition={[-40, -8, -20]}
        inclination={0.08}
        azimuth={0.55}
        turbidity={2}
        rayleigh={0.15}
        mieCoefficient={0.002}
        mieDirectionalG={0.7}
      />
    );
  }

  return (
    <Sky
      distance={450000}
      sunPosition={[60, 18, 40]}
      inclination={0.52}
      azimuth={0.18}
      turbidity={6.5}
      rayleigh={0.9}
      mieCoefficient={0.006}
      mieDirectionalG={0.85}
    />
  );
};
