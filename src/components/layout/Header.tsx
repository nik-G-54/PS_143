import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Activity, 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Ship, 
  BarChart3, 
  FileText, 
  Sun, 
  Moon, 
  ShieldAlert 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { mockIncident } from '../../data/mockIncident';

export const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Determine page title and icon based on current path
  const getPageDetails = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return {
          title: 'DASHBOARD',
          icon: <LayoutDashboard size={18} className="text-[#00B894] dark:text-[#00D9A6]" />
        };
      case '/live-map':
        return {
          title: 'LIVE MAP',
          icon: <Map size={18} className="text-[#00B894] dark:text-[#00D9A6]" />
        };
      case '/incidents':
        return {
          title: 'INCIDENTS',
          icon: <AlertTriangle size={18} className="text-[#00B894] dark:text-[#00D9A6]" />
        };
      case '/vessels':
        return {
          title: 'VESSELS',
          icon: <Ship size={18} className="text-[#00B894] dark:text-[#00D9A6]" />
        };
      case '/analytics':
        return {
          title: 'ANALYTICS',
          icon: <BarChart3 size={18} className="text-[#00B894] dark:text-[#00D9A6]" />
        };
      case '/reports':
        return {
          title: 'REPORTS',
          icon: <FileText size={18} className="text-[#00B894] dark:text-[#00D9A6]" />
        };
      case '/incident-reconstruction':
        return {
          title: '3D INCIDENT RECONSTRUCTION',
          icon: <Activity size={18} className="text-[#00B894] dark:text-[#00D9A6]" />
        };
      default:
        return {
          title: 'OCEAN SENTINEL',
          icon: <Activity size={18} className="text-[#00B894] dark:text-[#00D9A6]" />
        };
    }
  };

  const { title, icon } = getPageDetails();

  return (
    <header className="h-16 bg-white dark:bg-[#1A1D27] border-b border-[#F0F0F0] dark:border-[#252830] flex items-center justify-between px-6 transition-colors duration-200 shrink-0">
      {/* Left: Route Title */}
      <div className="flex items-center gap-4">
        <h2 className="font-semibold text-[#1A1D23] dark:text-[#F1F5F9] flex items-center gap-2 text-sm tracking-wide uppercase">
          {icon}
          {title}
        </h2>
        {location.pathname === '/incident-reconstruction' && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 dark:text-slate-500">Incident:</span>
              <span className="font-mono text-[#00B894] dark:text-[#00D9A6] font-semibold">{mockIncident.id}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-0.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-full text-red-500 dark:text-red-400 text-xs font-semibold">
              <ShieldAlert size={12} />
              <span>{mockIncident.status}</span>
            </div>
          </>
        )}
      </div>
      
      {/* Right: Status and Theme Toggle */}
      <div className="flex items-center gap-5">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B894] dark:bg-[#00D9A6] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B894] dark:bg-[#00D9A6] shadow-[0_0_6px_rgba(0,184,148,0.5)]"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.5px]">System Online</span>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-200 dark:bg-[#252830]"></div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[#6B7280] dark:border-[#252830] dark:bg-[#1A1D27] dark:hover:bg-[#252830] dark:text-[#94A3B8] transition-all duration-200 shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </button>
      </div>
    </header>
  );
};
