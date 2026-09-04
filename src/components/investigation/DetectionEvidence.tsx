// src/components/investigation/DetectionEvidence.tsx

import React, { useState } from 'react';
import { Camera, ImageOff } from 'lucide-react';

interface DetectionEvidenceProps {
  imageUrl?: string | null;
  spillId: string;
}

export const DetectionEvidence: React.FC<DetectionEvidenceProps> = ({ imageUrl, spillId }) => {
  const [imageError, setImageError] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-2.5 w-full bg-card/60 p-4 rounded-xl border border-border font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={15} className="text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Detection Evidence
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
          Sentinel SAR
        </span>
      </div>

      <div className="relative w-full h-44 rounded-xl bg-background border border-border overflow-hidden flex items-center justify-center">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`Satellite detection evidence for ${spillId}`}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-opacity duration-200"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground text-xs">
            <ImageOff size={22} className="text-muted-foreground/60" />
            <span>Satellite imagery unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
};
