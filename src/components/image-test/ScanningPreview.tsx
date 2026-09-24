import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  imageUrl: string;
  status: 'uploading' | 'scanning';
}

export function ScanningPreview({ imageUrl, status }: Props) {
  const [imgError, setImgError] = useState(false);

  function handleImgError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
    try {
      console.error('[ScanningPreview] Failed to render preview image from URL:', imageUrl, e);
      setImgError(true);
    } catch (err) {
      console.error('[ScanningPreview] Error in image error handler:', err);
    }
  }

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-xl flex items-center justify-center">
      {!imgError ? (
        <img 
          src={imageUrl} 
          alt="Uploaded satellite" 
          className="w-full h-full object-cover opacity-85" 
          onError={handleImgError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4 bg-slate-950 text-center">
          <p className="text-xs text-red-400 font-mono">
            [Image Render Error] Could not load image preview.
          </p>
        </div>
      )}

      {/* Subtle Backdrop Dimmer */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none" />

      {/* Soft Glassmorphic Light Shimmer Sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="glass-shimmer-bar absolute -inset-y-10 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 dark:via-indigo-400/20 to-transparent blur-md" />
      </div>

      {/* Floating Minimal Glassmorphic Status HUD */}
      <div className="relative z-10 px-4 py-3 rounded-2xl bg-black/50 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/60 shadow-2xl flex items-center gap-3 text-white max-w-[85%]">
        {status === 'uploading' ? (
          <>
            <div className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin shrink-0" />
            <span className="text-xs font-sans font-medium text-white">Uploading image...</span>
          </>
        ) : (
          <>
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-7 h-7 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
              <Sparkles className="w-3 h-3 text-indigo-400 absolute" />
            </div>
            <div className="space-y-0.5 text-left">
              <div className="text-xs font-bold font-sans text-white">
                Analyzing Surface Signatures
              </div>
              <div className="text-[10px] font-sans text-slate-300/80">
                Scanning for oil spills...
              </div>
            </div>
          </>
        )}
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
