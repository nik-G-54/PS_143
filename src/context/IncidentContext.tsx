import React, { createContext, useContext, useState, useEffect } from 'react';
import { spillService } from '../services/spillService';
import { BacktrackResponse, VesselsResponse } from '../types/api';

interface IncidentContextProps {
  spillId: string;
  setSpillId: (id: string) => void;
  backtrackData: BacktrackResponse | null;
  vesselsData: VesselsResponse | null;
  selectedVesselId: string | null;
  setSelectedVesselId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const IncidentContext = createContext<IncidentContextProps | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spillId, setSpillId] = useState<string>('spill_dba12b'); // Default spill
  const [backtrackData, setBacktrackData] = useState<BacktrackResponse | null>(null);
  const [vesselsData, setVesselsData] = useState<VesselsResponse | null>(null);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const validateBacktrack = (res: BacktrackResponse) => {
    const { backtrack } = res;
    if (!backtrack) throw new Error('API Error: Missing backtrack object');
    
    // Observation is required to determine scene origin
    if (!backtrack.observation) {
      throw new Error('API Error: Missing observation data');
    }
    
    if (typeof backtrack.observation.latitude !== 'number' || typeof backtrack.observation.longitude !== 'number') {
      throw new Error('API Error: Invalid observation coordinates');
    }

    if (!backtrack.observation.timestamp || isNaN(Date.parse(backtrack.observation.timestamp))) {
      throw new Error('API Error: Invalid observation timestamp');
    }

    // Source estimate is optional but if present must have valid coords
    if (backtrack.source_estimate) {
      if (typeof backtrack.source_estimate.latitude !== 'number' || typeof backtrack.source_estimate.longitude !== 'number') {
        console.warn('API Warning: Invalid source estimate coordinates');
        // Do not crash, let the UI handle missing source gracefully
      }
    }
  };

  const fetchData = React.useCallback(async () => {
    if (!spillId) return;
    setLoading(true);
    setError(null);
    try {
      const [backtrackRes, vesselsRes] = await Promise.all([
        spillService.backtrackSpill(spillId),
        spillService.getSpillVessels(spillId)
      ]);
      
      validateBacktrack(backtrackRes);

      setBacktrackData(backtrackRes);
      setVesselsData(vesselsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident data');
    } finally {
      setLoading(false);
    }
  }, [spillId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <IncidentContext.Provider value={{ spillId, setSpillId, backtrackData, vesselsData, selectedVesselId, setSelectedVesselId, loading, error, refresh: fetchData }}>
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncident = () => {
  const context = useContext(IncidentContext);
  if (!context) throw new Error('useIncident must be used within IncidentProvider');
  return context;
};
