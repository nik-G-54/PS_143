import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { spillService } from '../services/spillService';
import { BacktrackResponse, VesselsResponse } from '../types/api';
import { resolveReconstruction, DataSources } from '../services/reconstructionResolver';

interface IncidentContextProps {
  spillId: string;
  setSpillId: (id: string) => void;
  backtrackData: BacktrackResponse | null;
  vesselsData: VesselsResponse | null;
  spillDetails: any | null;
  environment: any | null;
  dataSources: DataSources | null;
  selectedVesselId: string | null;
  setSelectedVesselId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const IncidentContext = createContext<IncidentContextProps | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spillId, setSpillId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) return id;
    return import.meta.env.VITE_USE_MOCK_API === 'true' ? 'spill_A' : 'spill_dba12b';
  });
  const [spillDetails, setSpillDetails] = useState<any | null>(null);
  const [backtrackData, setBacktrackData] = useState<BacktrackResponse | null>(null);
  const [vesselsData, setVesselsData] = useState<VesselsResponse | null>(null);
  const [environment, setEnvironment] = useState<any | null>(null);
  const [dataSources, setDataSources] = useState<DataSources | null>(null);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Read URL changes to sync spillId
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && id !== spillId) {
      setSpillId(id);
    }
  }, [location.search]);

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
    setSpillDetails(null);
    setBacktrackData(null);
    setVesselsData(null);
    setEnvironment(null);
    setDataSources(null);
    setSelectedVesselId(null);
    
    try {
      const [detailsRes, backtrackRes, vesselsRes, visRes] = await Promise.all([
        spillService.getSpill(spillId),
        spillService.backtrackSpill(spillId),
        spillService.getSpillVessels(spillId),
        spillService.getVisualization(spillId).catch(() => null) // Optional
      ]);
      
      validateBacktrack(backtrackRes);

      const resolved = resolveReconstruction(detailsRes, backtrackRes, vesselsRes, visRes);

      setSpillDetails(resolved.spillDetails);
      setBacktrackData(resolved.backtrackData);
      setVesselsData(resolved.vesselsData);
      setEnvironment(resolved.environment);
      setDataSources(resolved.dataSources);
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
    <IncidentContext.Provider value={{ spillId, setSpillId, spillDetails, backtrackData, vesselsData, environment, dataSources, selectedVesselId, setSelectedVesselId, loading, error, refresh: fetchData }}>
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncident = () => {
  const context = useContext(IncidentContext);
  if (!context) throw new Error('useIncident must be used within IncidentProvider');
  return context;
};

export const useIncidentOptional = () => {
  return useContext(IncidentContext);
};
