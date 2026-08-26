import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-lg">
            <h1 className="text-3xl font-bold text-cyan-400">{title}</h1>
            <p className="text-slate-400">
              This route has been configured. Teammates can create a dedicated page component for this feature and replace this placeholder in <code>App.tsx</code>.
            </p>
            <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-500 font-mono text-left">
              // To start working on this page:<br/>
              1. Create src/pages/{title.replace(/\s+/g, '')}Page.tsx<br/>
              2. Import it into src/App.tsx<br/>
              3. Replace the placeholder element.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
