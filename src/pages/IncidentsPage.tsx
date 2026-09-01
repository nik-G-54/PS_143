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
    // Navigate to 3D Incident Reconstruction if OS-001 (teammate's page)
    if (id === 'OS-001') {
      navigate('/incident-reconstruction');
    } else {
      alert(`Navigation to details for incident ${id} will be integrated in future phases.`);
    }
  }, [navigate]);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#0F1117] text-[#4B5563] dark:text-[#94A3B8] overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pt-8 pb-6 px-10 space-y-6">
          {/* Page Header Section */}
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-[rgba(0,184,148,0.1)] dark:bg-[rgba(0,217,166,0.1)] flex items-center justify-center text-[#00B894] dark:text-[#00D9A6] shrink-0">
              <AlertTriangle size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-[#1A1D23] dark:text-[#F1F5F9] leading-tight">
                Incidents Dashboard
              </h1>
              <p className="text-[15px] text-[#6B7280] dark:text-[#94A3B8] mt-2">
                Monitor and investigate satellite-detected oil spill incidents in the Mediterranean Sea.
              </p>
            </div>
          </div>

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
