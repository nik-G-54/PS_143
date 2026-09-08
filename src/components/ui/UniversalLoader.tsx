// src/components/ui/UniversalLoader.tsx

import React from 'react';
import LoaderOne from './loader-one';

interface UniversalLoaderProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  className?: string;
}

export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  message = 'Loading Maritime Intelligence Feed...',
  submessage = 'Connecting to Sentinel SAR & AIS Telemetry Streams',
  fullScreen = false,
  className = '',
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 text-center font-sans select-none ${className}`}>
      <div className="p-6 bg-card/90 border border-border/80 rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center justify-center gap-3.5 max-w-sm">
        <LoaderOne size="lg" />
        <div>
          <div className="text-sm font-bold text-foreground font-mono tracking-tight">{message}</div>
          {submessage && (
            <div className="text-xs text-muted-foreground font-sans mt-1 font-medium leading-relaxed">{submessage}</div>
          )}
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="w-full py-16 flex items-center justify-center">{content}</div>;
};

export default UniversalLoader;
