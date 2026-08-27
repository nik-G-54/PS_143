import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#0F1117] text-[#4B5563] dark:text-[#94A3B8] overflow-hidden font-sans transition-colors duration-150">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg">
            {/* Title */}
            <h1 className="text-3xl font-bold text-[#1A1D23] dark:text-[#F1F5F9]">
              {title} Page
            </h1>
            
            {/* Subtext */}
            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
              This route has been configured under Ocean Sentinel's Averra dashboard layout. A dedicated page component will be built for this feature.
            </p>
            
            {/* Instructions box formatted like an Averra card */}
            <div className="p-5 bg-[#FAFBFC] dark:bg-[#1A1D27] border border-[#F0F0F0] dark:border-[#252830] rounded-xl text-left text-xs text-[#9CA3AF] dark:text-[#64748B] font-mono leading-relaxed shadow-none">
              <span className="text-[#00B894] dark:text-[#00D9A6]">// To begin development on this view:</span><br/>
              1. Create <span className="text-[#1A1D23] dark:text-[#F1F5F9]">src/pages/{title.replace(/\s+/g, '')}Page.tsx</span><br/>
              2. Implement using the Averra styling system (<span className="text-slate-400">design.md</span>)<br/>
              3. Update import and component mappings in <span className="text-slate-400">src/App.tsx</span>.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
