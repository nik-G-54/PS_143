import { useState } from 'react';

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
    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--fg)]/10">
      {!imgError ? (
        <img 
          src={imageUrl} 
          alt="Uploaded satellite" 
          className="w-full h-full object-cover" 
          onError={handleImgError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4 bg-black/80 text-center">
          <p className="text-xs text-red-400 font-mono">
            [Image Render Error] Could not load image preview.
          </p>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
        {status === 'uploading' ? (
          <>
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm mt-3 font-[var(--font-sans)]">Uploading image...</p>
          </>
        ) : (
          <>
            {/* Scanning line */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute left-0 right-0 h-0.5"
                style={{
                  backgroundColor: 'var(--brand)',
                  boxShadow: '0 0 20px var(--brand)',
                  animation: 'scanLine 2s ease-in-out infinite',
                }}
              />
            </div>
            <div className="relative z-10 w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
            <p className="relative z-10 text-white text-sm mt-3 font-[var(--font-sans)]">Scanning for oil spills...</p>
          </>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
