import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-150">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg">
            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground font-sans">
              {title} Page
            </h1>
            
            {/* Subtext */}
            <p className="text-sm text-muted-foreground font-sans">
              This route has been configured under Ocean Sentinel's Claude Amber dashboard layout.
            </p>
            
            {/* Instructions box */}
            <div className="p-5 bg-card border border-border rounded-xl text-left text-xs text-muted-foreground font-mono leading-relaxed shadow-sm">
              <span className="text-primary">// To begin development on this view:</span><br/>
              1. Create <span className="text-foreground">src/pages/{title.replace(/\s+/g, '')}Page.tsx</span><br/>
              2. Implement using the Claude Amber styling system<br/>
              3. Update import and component mappings in <span className="text-foreground font-semibold">src/App.tsx</span>.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
