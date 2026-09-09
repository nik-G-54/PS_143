import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MaritimeMapPage } from './features/maritime-map/page/MaritimeMapPage';
import { IncidentReconstructionPage } from './pages/IncidentReconstructionPage';
import { DashboardPage } from './pages/DashboardPage';
import { ThreeDVisualisationPage } from './pages/ThreeDVisualisationPage';

const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const ImageTestPage = lazy(() => import('./pages/ImageTestPage'));

const PageLoader = () => (
  <div className="flex h-screen w-full bg-background items-center justify-center text-primary font-medium font-sans">
    <div className="flex flex-col items-center gap-3">
      <span className="relative flex h-8 w-8">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-8 w-8 bg-primary shadow-[0_0_12px_var(--primary)]"></span>
      </span>
      <span>Loading Sentinel Systems...</span>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Active Navigation Routes */}
      <Route path="/" element={<DashboardPage />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/maritime-map" element={<MaritimeMapPage />} />
      <Route 
        path="/incidents" 
        element={
          <Suspense fallback={<PageLoader />}>
            <IncidentsPage />
          </Suspense>
        } 
      />
      <Route path="/incident-reconstruction" element={<IncidentReconstructionPage />} />
      <Route path="/3d-visualisation" element={<ThreeDVisualisationPage />} />
      <Route 
        path="/test-image" 
        element={
          <Suspense fallback={<PageLoader />}>
            <ImageTestPage />
          </Suspense>
        } 
      />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
