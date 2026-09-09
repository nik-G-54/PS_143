import React, { useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { useTheme } from '../context/ThemeContext';

export const ThreeDVisualisationPage: React.FC = () => {
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const syncThemeToIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Direct DOM class toggle (same-origin / public folder)
    try {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc?.documentElement) {
        if (theme === 'dark') {
          iframeDoc.documentElement.classList.add('dark');
        } else {
          iframeDoc.documentElement.classList.remove('dark');
        }
      }
    } catch {
      // Ignore cross-origin access errors if any
    }

    // Message dispatch for decoupling
    try {
      iframe.contentWindow?.postMessage({ type: 'THEME_CHANGE', theme }, '*');
    } catch {
      // Ignore message errors if any
    }
  }, [theme]);

  useEffect(() => {
    syncThemeToIframe();
  }, [theme, syncThemeToIframe]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <div className="flex-1 w-full min-h-0 overflow-hidden relative bg-background">
          <iframe
            ref={iframeRef}
            src="/3d-visualisation/index.html"
            title="3D Visualisation"
            className="w-full h-full border-none block"
            style={{ border: 'none', width: '100%', height: '100%', backgroundColor: 'transparent' }}
            allow="fullscreen"
            allowFullScreen
            onLoad={syncThemeToIframe}
          />
        </div>
      </main>
    </div>
  );
};

export default ThreeDVisualisationPage;
