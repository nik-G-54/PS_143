import React, { useMemo } from 'react';

import { Play, Pause } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { useIncident } from '../../context/IncidentContext';

// Helper to format ISO strings to short HH:mm dates
const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
};

export const Timeline: React.FC = () => {
  const { isPlaying, togglePlay, progress, setProgress, direction, setDirection } = useSimulation();
  const { backtrackData } = useIncident();

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width));
    const newProgress = clickX / bounds.width;
    setProgress(newProgress);
  };

  const timelineEvents = useMemo(() => {
    if (backtrackData) {
      const releaseTime = formatTime(backtrackData.backtrack.estimated_release_time);
      const obsTime = formatTime(backtrackData.backtrack.observation.timestamp);

      if (direction === 'FORWARD') {
        return [
          { label: 'EST. RELEASE', time: releaseTime },
          { label: 'OBSERVATION', time: obsTime, isIncident: true }
        ];
      } else {
        return [
          { label: 'OBSERVATION', time: obsTime, isIncident: true },
          { label: 'EST. RELEASE', time: releaseTime }
        ];
      }
    }
    return [
      { label: 'START', time: '00:00' },
      { label: 'END', time: '23:59' }
    ];
  }, [backtrackData, direction]);

  return (
    <div className="bg-card border-t border-border h-16 flex flex-col justify-center px-6 relative z-10 shrink-0">
      <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
        
        {/* Backtrack Button */}
        <button
          onClick={() => setDirection('BACKTRACK')}
          className={`px-4 py-1.5 text-xs font-semibold tracking-wider font-sans rounded transition-colors border ${
            direction === 'BACKTRACK' 
              ? 'bg-primary/20 text-primary border-primary/50 shadow-sm' 
              : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          BACKTRACK
        </button>

        {/* Play/Pause */}
        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground shrink-0 transition-colors shadow-md"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        
        {/* Scrubber Line */}
        <div 
          className="flex-1 relative flex items-center h-10 cursor-pointer group/timeline mx-4"
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
            {timelineEvents.map((event, idx) => {
              const nodeProgress = idx / (timelineEvents.length - 1);
              const isPast = progress >= nodeProgress;
              const isCurrent = Math.abs(progress - nodeProgress) < 0.05;
              
              return (
                <div key={idx} className="relative flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 transition-colors z-10 ${
                    isCurrent ? 'bg-primary border-background scale-125 shadow-[0_0_10px_var(--primary)]' :
                    isPast ? 'bg-primary border-primary' : 
                    'bg-card border-border'
                  }`} />
                  
                  <div className={`absolute -top-6 flex flex-col items-center whitespace-nowrap ${
                    idx === 0 ? 'items-start -left-1' : idx === timelineEvents.length - 1 ? 'items-end -right-1' : 'items-center'
                  }`}>
                    <span className={`text-[9px] font-semibold tracking-wider font-sans ${
                      event.isIncident ? 'text-red-500' : (isCurrent ? 'text-primary' : 'text-muted-foreground')
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

        {/* Forward Button */}
        <button
          onClick={() => setDirection('FORWARD')}
          className={`px-4 py-1.5 text-xs font-semibold tracking-wider font-sans rounded transition-colors border ${
            direction === 'FORWARD' 
              ? 'bg-primary/20 text-primary border-primary/50 shadow-sm' 
              : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          FORWARD
        </button>

      </div>
    </div>
  );
};
