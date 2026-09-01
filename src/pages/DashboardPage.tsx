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

  // Compute glow RGB color dynamically based on active theme
  const glowColor = theme === 'dark' ? '0, 217, 166' : '14, 165, 229';

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-gradient-to-br from-[#0D9488] to-white dark:bg-[#0F1117] items-center justify-center text-[#0D9488] dark:text-[#00D9A6] font-medium">
        <div className="flex flex-col items-center gap-3">
          <span className="relative flex h-8 w-8">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D9488] dark:bg-[#00D9A6] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-8 w-8 bg-[#0D9488] dark:bg-[#00D9A6]"></span>
          </span>
          <span>Loading Dashboard Metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full bg-gradient-to-br from-[#0D9488] to-white dark:bg-[#0F1117] items-center justify-center text-red-500 font-medium">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle size={32} />
          <span>Error loading dashboard statistics. Please refresh.</span>
        </div>
      </div>
    );
  }

  // Standard high contrast card class with responsive hover highlights
  const cardClassName = "card bg-white dark:bg-[#1A1D27] border border-slate-200 dark:border-[#2C303E] hover:border-slate-300 dark:hover:border-[#00D9A6]/40 rounded-xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out h-full flex flex-col justify-between";

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#0F1117] text-slate-700 dark:text-slate-300 overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pt-8 pb-8 px-10 space-y-6 bg-gradient-to-br from-[#0D9488] to-white dark:bg-none dark:bg-[#0F1117]">

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
                enableStars={false} // Disabled hover stars as requested
                enableTilt={false}  // Disabled tilt as requested
                clickEffect={true}
                enableMagnetism={false}
              >
                <SatelliteRadar />
              </ParticleCard>
            </div>

            {/* ROW 1 RIGHT: Recent Alerts Table (8 columns) */}
            <div className="col-span-12 lg:col-span-8">
              <ParticleCard
                className="card card--border-glow bg-white dark:bg-[#1A1D27] border border-slate-300 dark:border-[#2C303E] hover:border-slate-400 dark:hover:border-[#00D9A6]/40 rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out h-full flex flex-col"
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
                className="card card--border-glow bg-white dark:bg-[#1A1D27] border border-slate-300 dark:border-[#2C303E] hover:border-slate-400 dark:hover:border-[#00D9A6]/40 rounded-xl p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out h-full flex flex-col"
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
