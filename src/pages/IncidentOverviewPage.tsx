// src/pages/IncidentOverviewPage.tsx

import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { DashboardProvider, useDashboardContext } from '../context/DashboardContext';
import { DashboardFilters } from '../components/dashboard/DashboardFilters';
import { ActiveFilterChips } from '../components/dashboard/ActiveFilterChips';
import { SpillTable } from '../components/dashboard/SpillTable';
import { SpillPreviewDrawer } from '../components/dashboard/SpillPreviewDrawer';
import { LoadingState } from '../components/dashboard/LoadingState';
import { ErrorState } from '../components/dashboard/ErrorState';

const IncidentOverviewContent: React.FC = () => {
  const { isLoading, error, refetch } = useDashboardContext();

  return (
    <div className="flex-1 overflow-y-auto pt-6 pb-16 px-4 sm:px-6 lg:px-8 space-y-6 bg-background font-sans">
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* Global Filter Controls */}
          <DashboardFilters />

          {/* Active Filter Badges */}
          <ActiveFilterChips />

          {/* Dedicated Incident Overview Table (Full Paginated View) */}
          <SpillTable isFullPage={true} />
        </>
      )}
    </div>
  );
};

export const IncidentOverviewPage: React.FC = () => {
  return (
    <DashboardProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          <IncidentOverviewContent />
        </main>
      </div>
      <SpillPreviewDrawer />
    </DashboardProvider>
  );
};

export default IncidentOverviewPage;