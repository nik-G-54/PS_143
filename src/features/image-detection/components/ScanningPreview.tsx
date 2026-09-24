import { Loader2, Sparkles } from 'lucide-react';

interface Props {
  imageUrl: string;
}

export function ScanningPreview({ imageUrl }: Props) {
  return (
    <div className="rounded-2xl p-6 bg-card border border-border shadow-md space-y-6 font-sans animate-in fade-in-50 duration-300">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h2 className="text-lg font-bold font-sans text-foreground">
              Analyzing SAR Satellite Image
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            AI neural vision model processing Sentinel-1 satellite imagery
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-2 shadow-xs">
          <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          <span>Processing AI Vision</span>
        </div>
      </div>

      {/* Image Container with Glassmorphism Shimmer Sweep */}
      <div className="relative w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-black border border-border shadow-md flex items-center justify-center group select-none">
        {/* Base SAR Satellite Image */}
        <img
          src={imageUrl}
          alt="Scanning SAR"
          className="w-full h-full object-contain opacity-85 transition-opacity duration-500"
        />

        {/* Subtle Backdrop Dimmer */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none" />

        {/* Soft Glassmorphic Light Shimmer Sweep */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="glass-shimmer-bar absolute -inset-y-10 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 dark:via-indigo-400/25 to-transparent blur-md" />
        </div>

        {/* Floating Minimal Glassmorphic Status HUD */}
        <div className="relative z-10 px-5 py-3.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-2xl flex items-center gap-3.5 text-foreground max-w-xs sm:max-w-sm">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 absolute" />
          </div>
          <div className="space-y-0.5 text-left">
            <div className="text-xs sm:text-sm font-bold font-sans text-white tracking-wide">
              Analyzing Surface Signatures
            </div>
            <div className="text-[11px] font-sans text-slate-300/80">
              Extracting backscatter anomalies & geometry...
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Shimmer Animation Keyframe */}
      <style>{`
        @keyframes glassShimmer {
          0% {
            transform: translateX(-150%) skewX(-12deg);
          }
          50% {
            transform: translateX(250%) skewX(-12deg);
          }
          100% {
            transform: translateX(250%) skewX(-12deg);
          }
        }

        .glass-shimmer-bar {
          animation: glassShimmer 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
