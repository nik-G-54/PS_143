import React, { useCallback } from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useViewportCamera } from '../../../context/ViewportCameraContext';

const INITIAL_POSITION: [number, number, number] = [45, 20, 65];
const INITIAL_TARGET: [number, number, number] = [0, 0, 0];

export const SceneCamera: React.FC = () => {
  const { setApi } = useViewportCamera();

  const bindControls = useCallback((controls: OrbitControlsImpl | null) => {
    if (!controls) {
      setApi(null);
      return;
    }

    setApi({
      zoomIn: () => {
        controls.dollyIn(1.35);
        controls.update();
      },
      zoomOut: () => {
        controls.dollyOut(1.35);
        controls.update();
      },
      reset: () => {
        controls.object.position.set(...INITIAL_POSITION);
        controls.target.set(...INITIAL_TARGET);
        controls.update();
      },
    });
  }, [setApi]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={INITIAL_POSITION}
        fov={45}
        near={0.1}
        far={3000}
      />
      <OrbitControls
        ref={bindControls}
        makeDefault
        target={INITIAL_TARGET}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
};
