import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface Props {
  imageUrl: string;
}

const PIPELINE_STAGES = [
  'Image uploaded',
  'SAR imagery validated',
  'Running oil-spill detection',
  'Analysing detected regions',
  'Preparing incident data',
];

export function ScanningPreview({ imageUrl }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // Start at step 3

  useEffect(() => {
    const t1 = setTimeout(() => setCurrentStepIndex(3), 1200);
    const t2 = setTimeout(() => setCurrentStepIndex(4), 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="rounded-2xl p-6 bg-card border border-border shadow-lg space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-sans text-foreground">
            Analyzing Image
          </h2>
          <p className="text-xs text-muted-foreground font-sans">
            AI model is scanning SAR satellite imagery for oil spill signatures
          </p>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-primary/10 border border-primary/20 text-primary flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Processing</span>
        </div>
      </div>

      {/* Image with Subtle Scanning Line Treatment */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-border/80">
        <img
          src={imageUrl}
          alt="Scanning SAR"
          className="w-full h-full object-contain opacity-80"
        />

        {/* Subtle Scanning Radar Overlay */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Scanning horizontal laser line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-90"
            style={{
              boxShadow: '0 0 15px var(--primary)',
              animation: 'scanLine 2.4s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Analysis Pipeline Progress */}
      <div className="p-4 rounded-xl bg-accent/40 border border-border/60 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between text-muted-foreground font-semibold pb-1 border-b border-border/40">
          <span>ANALYSIS PIPELINE</span>
          <span>STAGE {Math.min(currentStepIndex + 1, 5)} / 5</span>
        </div>

        <div className="space-y-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={stage}
                className={`flex items-center gap-2.5 transition-all duration-300 ${
                  isDone
                    ? 'text-emerald-500 font-semibold'
                    : isCurrent
                    ? 'text-primary font-bold animate-pulse'
                    : 'text-muted-foreground/40'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 shrink-0" />
                )}
                <span>{stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 96%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
