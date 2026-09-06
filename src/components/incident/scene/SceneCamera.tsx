import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useViewportCamera } from '../../../context/ViewportCameraContext';
import { useIncident } from '../../../context/IncidentContext';
import {
  collectReconstructionPoints,
  computeFramedCameraPose,
  computeSceneBounds,
  type FramedCameraPose,
} from '../../../utils/sceneBounds';

const FALLBACK_POSE: FramedCameraPose = {
  position: [55, 28, 85],
  target: [0, 0.5, 0],
  minDistance: 5,
  maxDistance: 1400,
};

const FOV = 48;

export const SceneCamera: React.FC = () => {
  const { setApi } = useViewportCamera();
  const { spillId, spillDetails, backtrackData, vesselsData } = useIncident();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const framedPoseRef = useRef<FramedCameraPose>(FALLBACK_POSE);

  const framedPose = useMemo(() => {
    const points = collectReconstructionPoints(
      backtrackData,
      spillDetails,
      vesselsData?.vessels
    );
    const bounds = computeSceneBounds(points);
    if (!bounds) return FALLBACK_POSE;
    return computeFramedCameraPose(bounds, FOV);
  }, [backtrackData, spillDetails, vesselsData]);

  useEffect(() => {
    framedPoseRef.current = framedPose;
  }, [framedPose]);

  const applyPose = useCallback((pose: FramedCameraPose) => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...pose.position);
    controls.target.set(...pose.target);
    controls.minDistance = pose.minDistance;
    controls.maxDistance = pose.maxDistance;
    controls.update();
  }, []);

  // Frame once when incident data identity changes — never follow playback motion.
  useEffect(() => {
    applyPose(framedPose);
  }, [spillId, framedPose, applyPose]);

  const bindControls = useCallback(
    (controls: OrbitControlsImpl | null) => {
      controlsRef.current = controls;
      if (!controls) {
        setApi(null);
        return;
      }

      applyPose(framedPoseRef.current);

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
          applyPose(framedPoseRef.current);
        },
      });
    },
    [setApi, applyPose]
  );

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={framedPose.position}
        fov={FOV}
        near={0.1}
        far={8000}
      />
      <OrbitControls
        ref={bindControls}
        makeDefault
        target={framedPose.target}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={framedPose.minDistance}
        maxDistance={framedPose.maxDistance}
        maxPolarAngle={Math.PI / 2 - 0.02}
      />
    </>
  );
};
