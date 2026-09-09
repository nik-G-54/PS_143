// src/pages/DashboardPage.tsx

import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { DashboardProvider, useDashboardContext } from '../context/DashboardContext';
import { DashboardFilters } from '../components/dashboard/DashboardFilters';
import { ActiveFilterChips } from '../components/dashboard/ActiveFilterChips';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { SpillDetectionTrend } from '../components/dashboard/SpillDetectionTrend';
import { SpillSizeDistribution } from '../components/dashboard/SpillSizeDistribution';
import { DetectionHeatmap } from '../components/dashboard/DetectionHeatmap';
import { SpillTable } from '../components/dashboard/SpillTable';
import { SpillPreviewDrawer } from '../components/dashboard/SpillPreviewDrawer';
import { InvestigationDock } from '../components/investigation/InvestigationDock';
import { LoadingState } from '../components/dashboard/LoadingState';
import { ErrorState } from '../components/dashboard/ErrorState';

const DashboardContent: React.FC = () => {
  const { isLoading, error, refetch } = useDashboardContext();

  return (
    <div className="flex-1 overflow-y-auto pt-6 pb-20 px-4 sm:px-6 lg:px-8 space-y-6 bg-background">
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* Global Filter Bar */}
          <DashboardFilters />

          {/* Active Filter Chips */}
          <ActiveFilterChips />

          {/* KPI Cards (4 Grid) */}
          <KpiGrid />

          {/* Analytics Grid 1: Detection Trend & Size Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpillDetectionTrend />
            <SpillSizeDistribution />
          </div>

          {/* Analytics Section: Detection Activity Heatmap (Full Width) */}
          <div className="w-full">
            <DetectionHeatmap />
          </div>

          {/* Incident Overview Table (Max 7 Rows) */}
          <SpillTable />

          {/* Fixed Bottom Investigation Teaser Overlay */}
          <InvestigationDock />
        </>
      )}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  return (
    <DashboardProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          <DashboardContent />
        </main>
      </div>
      <SpillPreviewDrawer />
    </DashboardProvider>
  );
};

export default DashboardPage;
