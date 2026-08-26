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
    <div className="bg-slate-900 border-t border-slate-700 h-24 flex flex-col justify-center px-6 relative z-10">
      <div className="flex items-center gap-6">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center text-white shrink-0 transition-colors shadow-[0_0_15px_rgba(8,145,178,0.4)]"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
        </button>
        
        <div 
          className="flex-1 relative flex items-center h-12 cursor-pointer group/timeline"
          onClick={handleTimelineClick}
        >
          {/* Main Line */}
          <div className="absolute left-0 right-0 h-1 bg-slate-700 rounded transition-colors group-hover/timeline:bg-slate-600" />
          
          {/* Progress Line */}
          <div 
            className="absolute left-0 h-1 bg-cyan-500 rounded" 
            style={{ width: `${progress * 100}%` }}
          />
          
          {/* Interpolated Time Marker */}
          <div 
            className="absolute top-1/2 -mt-2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20 pointer-events-none"
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
                    isCurrent ? 'bg-cyan-400 border-white scale-125 shadow-[0_0_10px_rgba(34,211,238,0.8)]' :
                    isPast ? 'bg-cyan-500 border-cyan-500' : 
                    'bg-slate-800 border-slate-500'
                  }`} />
                  
                  <div className="absolute top-5 flex flex-col items-center w-24">
                    <span className={`text-[10px] font-semibold tracking-wider ${
                      event.isIncident ? 'text-red-400' : (isCurrent ? 'text-cyan-400' : 'text-slate-400')
                    }`}>
                      {event.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
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
