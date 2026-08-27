import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { IncidentReconstructionPage } from './pages/IncidentReconstructionPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));

const PageLoader = () => (
  <div className="flex h-screen w-full bg-slate-950 items-center justify-center text-cyan-400 font-medium">
    <div className="flex flex-col items-center gap-3">
      <span className="relative flex h-8 w-8">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-8 w-8 bg-cyan-500"></span>
      </span>
      <span>Loading Sentinel Systems...</span>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Team Routes (Placeholders for now) */}
      <Route path="/" element={<PlaceholderPage title="Dashboard" />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/live-map" element={<PlaceholderPage title="Live Map" />} />
      <Route 
        path="/incidents" 
        element={
          <Suspense fallback={<PageLoader />}>
            <IncidentsPage />
          </Suspense>
        } 
      />
      <Route path="/vessels" element={<PlaceholderPage title="Vessels" />} />
      <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
      <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
      
      {/* Your Dedicated Route */}
      <Route path="/incident-reconstruction" element={<IncidentReconstructionPage />} />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


export default App;
