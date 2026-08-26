import { Routes, Route, Navigate } from 'react-router-dom';
import { IncidentReconstructionPage } from './pages/IncidentReconstructionPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

function App() {
  return (
    <Routes>
      {/* Team Routes (Placeholders for now) */}
      <Route path="/" element={<PlaceholderPage title="Dashboard" />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/live-map" element={<PlaceholderPage title="Live Map" />} />
      <Route path="/incidents" element={<PlaceholderPage title="Incidents" />} />
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
