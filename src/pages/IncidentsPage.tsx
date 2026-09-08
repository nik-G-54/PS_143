import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { IncidentsTable } from '../components/incidents/IncidentsTable';
import { IncidentFilters } from '../components/incidents/IncidentFilters';
import { useIncidentFilters } from '../hooks/useIncidentFilters';
import { getAllSpills } from '../services/spillsApi';
import { MOCK_SPILL_LIST } from '../mocks/spillsData';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Incident } from '../types/incident';

const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);

    try {
      let rawItems: any[] = [];
      try {
        // Fetch ALL spills from API (fetches all pages)
        const allSpills = await getAllSpills();
        rawItems = allSpills && allSpills.length > 0 ? allSpills : [];
      } catch (apiErr: any) {
        console.warn('Backend getAllSpills API request failed, switching to mock dataset fallback:', apiErr);
        rawItems = MOCK_SPILL_LIST;
        setIsUsingFallback(true);
        setError('Live backend API is unavailable. Showing fallback incident records.');
      }

      const mapped: Incident[] = rawItems.map((d: any) => {
        const rawConf = d.confidence ?? d.confidence_score ?? 0;
        // Ensure decimal 0.0 - 1.0 format for confidence (e.g. 0.78 for 78%)
        const confDecimal = rawConf > 1 ? rawConf / 100 : rawConf;

        const dateObj = d.detectedAt instanceof Date 
          ? d.detectedAt 
          : (d.detected_at ? new Date(d.detected_at) : undefined);

        return {
          id: d.id || d.spill_id || 'N/A',
          date: dateObj ? dateObj.toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
          detectedAt: dateObj,
          latitude: d.latitude ?? d.centroid?.lat ?? d.centroid?.latitude ?? 0,
          longitude: d.longitude ?? d.centroid?.lon ?? d.centroid?.longitude ?? 0,
          locationName: d.locationName || d.location_name || '',
          status: d.status || null,
          confidence: confDecimal,
          vesselInvolved: `${d.candidateCount ?? d.candidate_count ?? 0} Candidates`,
          spillArea: d.area ?? d.area_km2 ?? 0,
        };
      });

      setIncidents(mapped);
    } catch (err: any) {
      console.error('Failed to parse incident data:', err);
      setError(err?.message || 'Failed to load incident records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const {
    filteredIncidents,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    totalCount,
    filteredCount,
  } = useIncidentFilters(incidents);

  const handleViewIncident = useCallback((id: string) => {
    if (id === 'OS-001' || id.startsWith('spill_')) {
      navigate(`/incident-reconstruction?id=${id}`);
    } else {
      alert(`Navigation to details for incident ${id} will be integrated in future phases.`);
    }
  }, [navigate]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pt-6 pb-6 px-10 space-y-6">

          {/* Connection Error Banner / Warning */}
          {error && isUsingFallback && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 flex items-center justify-between text-xs font-semibold gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchIncidents}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-amber-700 dark:text-amber-300 transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Retry API</span>
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <IncidentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            filteredCount={filteredCount}
            totalCount={totalCount}
          />

          {/* Incidents Table */}
          <IncidentsTable
            incidents={filteredIncidents}
            onViewIncident={handleViewIncident}
            loading={loading}
            error={error}
            onRetry={fetchIncidents}
          />
        </div>
      </main>
    </div>
  );
};

export default IncidentsPage;


