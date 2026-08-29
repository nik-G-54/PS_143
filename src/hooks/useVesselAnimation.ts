import { useState, useEffect, useRef } from 'react';

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  course: number;
}

export function useVesselAnimation(trajectory: RoutePoint[] | null, isPlaying: boolean) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [position, setPosition] = useState<{ lat: number; lng: number; course: number } | null>(null);
  
  const trajectoryRef = useRef<RoutePoint[] | null>(trajectory);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  // Keep refs up-to-date to avoid recreating the animation loop
  useEffect(() => {
    trajectoryRef.current = trajectory;
  }, [trajectory]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Main animate frame function
  const animate = (timestamp: number) => {
    const currentTrajectory = trajectoryRef.current;
    if (!isPlayingRef.current || !currentTrajectory || currentTrajectory.length === 0) {
      frameRef.current = undefined;
      return;
    }

    if (timestamp - lastTimeRef.current > 200) { // Move every 200ms
      lastTimeRef.current = timestamp;
      setCurrentIndex(prev => {
        const next = (prev + 1) % currentTrajectory.length;
        setPosition({ 
          lat: currentTrajectory[next].latitude, 
          lng: currentTrajectory[next].longitude,
          course: currentTrajectory[next].course
        });
        return next;
      });
    }

    frameRef.current = requestAnimationFrame(animate);
  };

  // Start the animation loop when playing and trajectory exists
  useEffect(() => {
    if (isPlaying && trajectory && trajectory.length > 0) {
      if (frameRef.current === undefined) {
        lastTimeRef.current = performance.now();
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
    };
  }, [isPlaying, trajectory]); // Restart only when play state or trajectory target actually changes

  const reset = () => {
    setCurrentIndex(0);
    setPosition(null);
  };

  return { position, reset, progress: trajectory ? currentIndex / trajectory.length : 0 };
}
export default useVesselAnimation;
