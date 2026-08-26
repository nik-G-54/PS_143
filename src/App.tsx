import { Routes, Route, Navigate } from 'react-router-dom';
import { IncidentReconstructionPage } from './pages/IncidentReconstructionPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/incident-reconstruction" replace />} />
      <Route path="/incident-reconstruction" element={<IncidentReconstructionPage />} />
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/incident-reconstruction" replace />} />
    </Routes>
  );
}

export default App;
