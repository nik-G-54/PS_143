// src/pages/DashboardPage.tsx

import React, { useRef } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { RecentIncidents } from '../components/dashboard/RecentIncidents';
import { SeverityDistribution } from '../components/dashboard/SeverityDistribution';
import { MonthlyTrend } from '../components/dashboard/MonthlyTrend';
import { CaseStatusChart } from '../components/dashboard/CaseStatusChart';
import { SatelliteRadar } from '../components/dashboard/SatelliteRadar';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import {
  BentoCardGrid,
  ParticleCard,
  GlobalSpotlight,
  useMobileDetection
} from '../components/dashboard/MagicBento';

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useMobileDetection();
  const { dashboardData, loading, error } = useDashboardStats();
  const gridRef = useRef<HTMLDivElement>(null);

  // Compute glow RGB color dynamically based on active theme (Claude Amber)
  const glowColor = theme === 'dark' ? '217, 119, 87' : '201, 100, 66';

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-background items-center justify-center text-primary font-medium">
        <div className="flex flex-col items-center gap-3">
          <span className="relative flex h-8 w-8">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-8 w-8 bg-primary"></span>
          </span>
          <span>Loading Dashboard Metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full bg-background items-center justify-center text-destructive font-medium">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle size={32} />
          <span>Error loading dashboard statistics. Please refresh.</span>
        </div>
      </div>
    );
  }

  // Standard high contrast card class with responsive hover highlights
  const cardClassName = "card bg-card border border-border hover:border-primary/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ease-out h-full flex flex-col justify-between";

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pt-8 pb-8 px-10 space-y-6 bg-background">

          {/* Global Spotlight tracker */}
          <GlobalSpotlight
            gridRef={gridRef}
            disableAnimations={isMobile}
            enabled={true}
            glowColor={glowColor}
            spotlightRadius={180}
          />

          {/* Bento Grid Layout (5-Card layout) */}
          <BentoCardGrid gridRef={gridRef} glowColor={glowColor}>

            {/* ROW 1 LEFT: Globe surveillance sphere (4 columns) */}
            <div className="col-span-12 lg:col-span-4">
              <ParticleCard
                className={cardClassName}
                glowColor={glowColor}
                disableAnimations={isMobile}
                enableStars={false}
                enableTilt={false}
                clickEffect={true}
                enableMagnetism={false}
              >
                <SatelliteRadar />
              </ParticleCard>
            </div>

            {/* ROW 1 RIGHT: Recent Alerts Table (8 columns) */}
            <div className="col-span-12 lg:col-span-8">
              <ParticleCard
                className="card bg-card border border-border hover:border-primary/40 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ease-out h-full flex flex-col"
                glowColor={glowColor}
                disableAnimations={isMobile}
                enableStars={false}
                enableTilt={false}
                clickEffect={true}
                enableMagnetism={false}
              >
                <RecentIncidents incidents={dashboardData.recentIncidents} />
              </ParticleCard>
            </div>

            {/* ROW 2 LEFT: Severity Distribution Solid Pie Chart (6 columns) */}
            <div className="col-span-12 lg:col-span-6">
              <ParticleCard
                className={cardClassName}
                glowColor={glowColor}
                disableAnimations={isMobile}
                enableStars={false}
                enableTilt={false}
                clickEffect={true}
                enableMagnetism={false}
              >
                <SeverityDistribution data={dashboardData.severityDistribution} />
              </ParticleCard>
            </div>

            {/* ROW 2 RIGHT: Case Status Radial Activity Rings (6 columns) */}
            <div className="col-span-12 lg:col-span-6">
              <ParticleCard
                className={cardClassName}
                glowColor={glowColor}
                disableAnimations={isMobile}
                enableStars={false}
                enableTilt={false}
                clickEffect={true}
                enableMagnetism={false}
              >
                <CaseStatusChart data={dashboardData.caseStatusDistribution} />
              </ParticleCard>
            </div>

            {/* ROW 3: Monthly Trend Heatmap Calendar Grid (12 columns - full width) */}
            <div className="col-span-12">
              <ParticleCard
                className="card bg-card border border-border hover:border-primary/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ease-out h-full flex flex-col"
                glowColor={glowColor}
                disableAnimations={isMobile}
                enableStars={false}
                enableTilt={false}
                clickEffect={true}
                enableMagnetism={false}
              >
                <MonthlyTrend data={dashboardData.monthlyTrend} />
              </ParticleCard>
            </div>

          </BentoCardGrid>
        </div>
      </main>
    </div>
  );
};
export default DashboardPage;
