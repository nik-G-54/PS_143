import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { IncidentsTable } from '../components/incidents/IncidentsTable';
import { IncidentFilters } from '../components/incidents/IncidentFilters';
import { useIncidentFilters } from '../hooks/useIncidentFilters';
import { spillService } from '../services/spillService';
import { Incident } from '../types/incident';

const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    spillService.getSpills().then(data => {
      const items = Array.isArray(data) ? data : data.items || [];
      const mapped = items.map((d: any) => ({
        id: d.spill_id,
        date: d.detected_at ? new Date(d.detected_at).toISOString().split('T')[0] : 'N/A',
        latitude: d.centroid?.latitude ?? d.centroid?.lat ?? 0,
        longitude: d.centroid?.longitude ?? d.centroid?.lon ?? 0,
        locationName: d.location_name || 'Mediterranean Sea',
        status: d.status || 'ACTIVE',
        confidence: d.confidence_score,
        vesselInvolved: `${d.candidate_count ?? 0} Candidates`,
        spillArea: d.area_km2,
        severity: d.area_km2 > 10 ? 'CRITICAL' : (d.area_km2 > 5 ? 'HIGH' : 'MEDIUM')
      }));
      setIncidents(mapped);
    });
  }, []);
  
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
          />
        </div>
      </main>
    </div>
  );
};

export default IncidentsPage;
