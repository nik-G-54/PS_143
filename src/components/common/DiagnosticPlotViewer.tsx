// src/components/common/DiagnosticPlotViewer.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Maximize2,
  X,
  RefreshCw,
  ImageOff,
  Activity,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { useDiagnosticPlot, DEFAULT_DIAGNOSTIC_PLOT_URL } from '../../services/diagnosticPlotService';

interface DiagnosticPlotViewerProps {
  spillId?: string | null;
  fallbackUrl?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  showBadge?: boolean;
  badgeText?: string;
  allowExpand?: boolean;
}

export const DiagnosticPlotViewer: React.FC<DiagnosticPlotViewerProps> = ({
  spillId,
  fallbackUrl,
  alt,
  className = '',
  containerClassName = '',
  showBadge = true,
  badgeText = 'Drift Diagnostic',
  allowExpand = true,
}) => {
  const { plotUrl, isLoading, error } = useDiagnosticPlot(spillId, fallbackUrl);
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isClosing, setIsClosing] = useState(false);

  const displayUrl = !imageError && plotUrl ? plotUrl : DEFAULT_DIAGNOSTIC_PLOT_URL;
  const imageAlt = alt || `Diagnostic plot for incident ${spillId || 'spill_ea0e3f'}`;

  // Graceful animated close handler
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
      setZoomLevel(1);
    }, 180);
  }, []);

  const handleOpen = useCallback(() => {
    if (!allowExpand || !displayUrl || imageError) return;
    setZoomLevel(1);
    setIsClosing(false);
    setIsExpanded(true);
  }, [allowExpand, displayUrl, imageError]);

  // Keyboard navigation: Escape key to close, + / - to zoom
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel((z) => Math.max(0.75, +(z - 0.25).toFixed(2)));
      } else if (e.key === '0') {
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent background body scrolling when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isExpanded, handleClose]);

  // Zoom controls
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((z) => Math.max(0.75, +(z - 0.25).toFixed(2)));
  };

  const handleZoomReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  const handleToggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((z) => (z === 1 ? 1.6 : 1));
  };

  return (
    <>
      {/* Thumbnail Container */}
      <div
        onClick={handleOpen}
        className={`group relative flex items-center justify-center overflow-hidden rounded-lg border border-border bg-[#020813] transition-all duration-200 ${
          allowExpand && displayUrl && !imageError ? 'cursor-pointer hover:border-primary/50' : ''
        } ${containerClassName || 'aspect-[4/3] w-full min-h-[180px]'}`}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#020813]/80 backdrop-blur-xs text-xs text-muted-foreground font-mono">
            <RefreshCw size={18} className="animate-spin text-primary" />
            <span>Loading diagnostic plot…</span>
          </div>
        )}

        {/* Main Image: strictly object-contain to prevent any cropping */}
        {displayUrl && !imageError ? (
          <img
            src={displayUrl}
            alt={imageAlt}
            loading="lazy"
            onError={() => setImageError(true)}
            className={`max-h-full max-w-full h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.02] select-none ${className}`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground p-4 text-center">
            <ImageOff size={22} className="text-muted-foreground/60" />
            <span>Diagnostic plot unavailable</span>
            {error && <span className="text-[10px] text-destructive/80">{error}</span>}
          </div>
        )}

        {/* Badge Indicator */}
        {showBadge && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded bg-black/80 px-2 py-0.5 text-[9px] font-mono font-semibold tracking-wider text-primary border border-white/10 backdrop-blur-xs pointer-events-none">
            <Activity size={10} className="text-primary" />
            <span>{badgeText}</span>
          </div>
        )}

        {/* Hover Hint & Expand Button */}
        {allowExpand && displayUrl && !imageError && (
          <>
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-full bg-black/85 px-3 py-1.5 text-xs font-medium text-white shadow-lg border border-white/20">
                <Maximize2 size={13} className="text-primary" />
                <span>Click to Expand</span>
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
              title="Expand full diagnostic plot"
              className="absolute top-2 right-2 z-20 rounded-md bg-black/80 p-1.5 text-white/80 backdrop-blur-xs border border-white/15 transition-all hover:text-white hover:bg-black/95 hover:scale-105"
            >
              <Maximize2 size={13} />
            </button>
          </>
        )}
      </div>

      {/* 
        Full-Screen Lightbox Modal:
        Rendered via React Portal directly into document.body!
        This guarantees it will NEVER be trapped inside parent backdrop-filter or overflow-hidden stacking contexts.
      */}
      {isExpanded &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Diagnostic Plot Viewer for ${spillId || 'Incident'}`}
            className={`fixed inset-0 z-[999999] flex flex-col bg-black/95 backdrop-blur-xl select-none transition-opacity duration-200 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={handleClose}
          >
            {/* Top Navigation & Controls Header */}
            <div
              className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/70 px-4 sm:px-6 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Back / Exit button + Incident Details */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 transition-all hover:bg-white/15 hover:text-white active:scale-95"
                  title="Close viewer (Esc)"
                >
                  <ArrowLeft size={14} />
                  <span>Back to View</span>
                  <span className="hidden sm:inline-block ml-1 rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground border border-white/10">
                    ESC
                  </span>
                </button>

                <div className="hidden sm:flex flex-col min-w-0 border-l border-white/10 pl-3">
                  <div className="flex items-center gap-2">
                    <Activity size={13} className="text-primary shrink-0" />
                    <span className="font-mono text-xs font-bold text-foreground truncate">
                      {spillId || 'Detection Evidence'}
                    </span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                      1600 × 1440
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    Authoritative Hydrodynamic Backtrack Diagnostic
                  </span>
                </div>
              </div>

              {/* Center: Zoom Controls */}
              <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.75}
                  className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="px-2 py-0.5 font-mono text-[11px] font-medium text-white/90 hover:bg-white/10 rounded transition-colors"
                  title="Reset Zoom (0)"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 2.5}
                  className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn size={14} />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    type="button"
                    onClick={handleZoomReset}
                    className="rounded p-1 text-primary hover:bg-white/10 transition-colors ml-0.5"
                    title="Reset to 100%"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>

              {/* Right: Actions & Close Button */}
              <div className="flex items-center gap-2">
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                  title="Open full resolution image in new tab"
                >
                  <ExternalLink size={13} />
                  <span className="text-[11px]">Original</span>
                </a>

                {/* Highly visible close button */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex items-center justify-center rounded-lg border border-white/20 bg-white/10 p-2 text-white shadow-lg transition-all hover:bg-red-500/30 hover:border-red-500/50 hover:text-red-300 hover:rotate-90 active:scale-95"
                  title="Close modal (Esc)"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Image Viewport: full flex center with pan/zoom */}
            <div
              className="relative flex-1 overflow-auto p-3 sm:p-6 flex items-center justify-center min-h-0"
              onClick={handleClose}
            >
              <div
                className={`relative flex items-center justify-center transition-transform duration-200 ease-out ${
                  isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                }`}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={displayUrl}
                  alt={imageAlt}
                  onDoubleClick={handleToggleZoom}
                  title="Double click to toggle zoom"
                  className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg border border-white/15 shadow-2xl bg-[#020813] select-none cursor-zoom-in active:cursor-grabbing"
                />
              </div>
            </div>

            {/* Bottom Status / Guidance Bar */}
            <div
              className="relative z-20 flex h-9 shrink-0 items-center justify-between border-t border-white/10 bg-black/70 px-4 sm:px-6 text-[11px] font-mono text-white/60 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Full Resolution Display (Exact Fit)
                </span>
                <span className="hidden md:inline text-white/40">·</span>
                <span className="hidden md:inline text-white/50">
                  Double-click image to toggle zoom
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-white/40">
                  Click outside or press <kbd className="rounded bg-white/10 px-1 py-0.5 text-white/80 font-mono">ESC</kbd> to close
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-primary hover:underline font-semibold sm:hidden"
                >
                  Close ✕
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
