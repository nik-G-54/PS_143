import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Activity, 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Sun, 
  Moon, 
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useIncidentOptional } from '../../context/IncidentContext';

import { IncidentSelector } from '../incident/IncidentSelector';

export const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const incidentContext = useIncidentOptional();

  // Determine page title and icon based on current path
  const getPageDetails = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return {
          title: 'DASHBOARD',
          icon: <LayoutDashboard size={18} className="text-primary" />
        };
      case '/live-map':
        return {
          title: 'LIVE MAP',
          icon: <Map size={18} className="text-primary" />
        };
      case '/incidents':
        return {
          title: 'INCIDENTS',
          icon: <AlertTriangle size={18} className="text-primary" />
        };
      case '/incident-reconstruction':
        return {
          title: '3D INCIDENT RECONSTRUCTION',
          icon: <Activity size={18} className="text-primary" />
        };
      default:
        return {
          title: 'NAUKA',
          icon: <Activity size={18} className="text-primary" />
        };
    }
  };

  const { title, icon } = getPageDetails();

  const incidentId = incidentContext?.spillId ?? incidentContext?.spillDetails?.spill_id ?? 'UNKNOWN';
  const incidentStatus = incidentContext?.loading ? 'LOADING...' : (incidentContext?.spillDetails?.status ?? 'ACTIVE');

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 transition-colors duration-200 shrink-0">
      {/* Left: Route Title */}
      <div className="flex items-center gap-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm tracking-wide uppercase font-sans">
          {icon}
          {title}
        </h2>
        {location.pathname === '/incident-reconstruction' && (
          <>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-sans">Incident:</span>
              <IncidentSelector currentSpillId={incidentId} />
            </div>
            <div className="flex items-center gap-2 px-3 py-0.5 bg-destructive/10 border border-destructive/20 rounded-full text-destructive text-xs font-semibold font-sans">
              {incidentContext?.loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
              <span>{incidentStatus}</span>
            </div>
          </>
        )}
      </div>
      
      {/* Right: Theme Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded-full border border-border bg-card hover:bg-accent text-foreground transition-all duration-200 shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </button>
      </div>
    </header>
  );
};
