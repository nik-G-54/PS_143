import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { IncidentsTable } from '../components/incidents/IncidentsTable';
import { IncidentFilters } from '../components/incidents/IncidentFilters';
import { useIncidentFilters } from '../hooks/useIncidentFilters';
import { MOCK_INCIDENTS } from '../data/mockIncidents';
import { AlertTriangle } from 'lucide-react';

const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    filteredIncidents,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    totalCount,
    filteredCount,
  } = useIncidentFilters(MOCK_INCIDENTS);

  const handleViewIncident = useCallback((id: string) => {
    if (id === 'OS-001') {
      navigate('/incident-reconstruction');
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
