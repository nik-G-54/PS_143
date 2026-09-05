// src/components/map/ResponsiveLayout.tsx
import { useState, useEffect, ReactNode } from 'react';

interface ResponsiveLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  controls?: ReactNode;
  timeline?: ReactNode;
  showSidebar?: boolean;
}

export function ResponsiveLayout({
  children,
  sidebar,
  controls,
  timeline,
  showSidebar = true
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      {/* Map - Full screen on all devices */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>

      {/* Desktop: Side panel always visible if showSidebar is true */}
      {!isMobile && sidebar && showSidebar && (
        <div className="absolute top-0 right-0 h-full w-96 z-20">
          {sidebar}
        </div>
      )}

      {/* Mobile: Toggle button */}
      {isMobile && sidebar && showSidebar && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="
            absolute top-4 right-4 z-30
            w-12 h-12 
            bg-slate-900/95 border border-slate-700
            rounded-full 
            flex items-center justify-center
            shadow-lg text-white text-xl cursor-pointer
          "
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Mobile: Slide-in sidebar */}
      {isMobile && sidebar && showSidebar && (
        <div
          className={`
            absolute top-0 right-0 h-full w-80 z-25
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {sidebar}
        </div>
      )}

      {/* Controls - Bottom left */}
      {controls && (
        <div className={`
          absolute z-20 pointer-events-auto
          ${isMobile ? 'bottom-20 left-2' : 'bottom-4 left-4'}
        `}>
          {controls}
        </div>
      )}

      {/* Timeline - Bottom bar */}
      {timeline && (
        <div className={`
          absolute left-0 right-0 z-20 pointer-events-none
          ${isMobile ? 'bottom-0 px-2' : 'bottom-4 left-4 right-96'}
        `}>
          {timeline}
        </div>
      )}
    </div>
  );
}
