import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';

export const ThreeDVisualisationPage: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden relative">
        <iframe
          src="/3d-visualisation/index.html"
          title="3D Visualisation"
          className="w-full h-full border-none block"
          style={{ border: 'none', width: '100%', height: '100%' }}
          allow="fullscreen"
          allowFullScreen
        />
      </main>
    </div>
  );
};

export default ThreeDVisualisationPage;
