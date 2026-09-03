import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useIncident } from './IncidentContext';

interface SimulationContextProps {
  isPlaying: boolean;
  togglePlay: () => void;
  progress: number; // 0 to 1
  setProgress: (p: number) => void;
  direction: 'FORWARD' | 'BACKTRACK';
  setDirection: (d: 'FORWARD' | 'BACKTRACK') => void;
}

const SimulationContext = createContext<SimulationContextProps | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastTimeRef = useRef<number>(0);
  const progressRef = useRef(progress);
  const { spillId } = useIncident();

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    lastTimeRef.current = 0;
  }, [spillId]);

  const SIMULATION_DURATION_MS = 20000; // 20 seconds for a full loop

  useEffect(() => {
    let animationFrameId: number;

    const tick = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (isPlaying) {
        let newProgress = progressRef.current + dt / SIMULATION_DURATION_MS;
        if (newProgress >= 1) {
          newProgress = 1;
          setIsPlaying(false);
        }
        setProgress(newProgress);
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (!isPlaying && progressRef.current >= 1) {
      setProgress(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const [direction, setDirection] = useState<'FORWARD' | 'BACKTRACK'>('FORWARD');

  return (
    <SimulationContext.Provider value={{ isPlaying, togglePlay: handleTogglePlay, progress, setProgress, direction, setDirection }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSimulation must be used within SimulationProvider");
  return context;
};
