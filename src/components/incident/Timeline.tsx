import React from 'react';
import { mockTimeline } from '../../data/mockIncident';
import { Play, Pause } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const Timeline: React.FC = () => {
  const { isPlaying, togglePlay, progress, setProgress } = useSimulation();

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width));
    const newProgress = clickX / bounds.width;
    setProgress(newProgress);
  };

  return (
    <div className="bg-card border-t border-border h-24 flex flex-col justify-center px-6 relative z-10">
      <div className="flex items-center gap-6">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground shrink-0 transition-colors shadow-md"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
        </button>
        
        <div 
          className="flex-1 relative flex items-center h-12 cursor-pointer group/timeline"
          onClick={handleTimelineClick}
        >
          {/* Main Line */}
          <div className="absolute left-0 right-0 h-1 bg-border rounded transition-colors group-hover/timeline:bg-muted-foreground/30" />
          
          {/* Progress Line */}
          <div 
            className="absolute left-0 h-1 bg-primary rounded" 
            style={{ width: `${progress * 100}%` }}
          />
          
          {/* Interpolated Time Marker */}
          <div 
            className="absolute top-1/2 -mt-2 w-4 h-4 bg-primary rounded-full shadow-[0_0_10px_var(--primary)] z-20 pointer-events-none border-2 border-background"
            style={{ left: `calc(${progress * 100}% - 8px)` }}
          />

          {/* Timeline Nodes */}
          <div className="absolute left-0 right-0 flex justify-between pointer-events-none">
            {mockTimeline.map((event, idx) => {
              const nodeProgress = idx / (mockTimeline.length - 1);
              const isPast = progress >= nodeProgress;
              const isCurrent = Math.abs(progress - nodeProgress) < 0.05;
              
              return (
                <div key={idx} className="relative flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 transition-colors z-10 ${
                    isCurrent ? 'bg-primary border-background scale-125 shadow-[0_0_10px_var(--primary)]' :
                    isPast ? 'bg-primary border-primary' : 
                    'bg-card border-border'
                  }`} />
                  
                  <div className="absolute top-5 flex flex-col items-center w-24">
                    <span className={`text-[10px] font-semibold tracking-wider font-sans ${
                      event.isIncident ? 'text-destructive' : (isCurrent ? 'text-primary' : 'text-muted-foreground')
                    }`}>
                      {event.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {event.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
