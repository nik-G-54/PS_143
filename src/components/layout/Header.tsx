import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Activity, 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Loader2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useIncidentOptional } from '../../context/IncidentContext';
import { useSidebar } from '../../context/SidebarContext';
import { ThemeToggle } from './ThemeToggle';
import { IncidentSelector } from '../incident/IncidentSelector';

export const Header: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();
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
          title: 'OCEAN SENTINEL',
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

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 transition-colors duration-200 shrink-0">
      {/* Left: Route Title */}
      <div className="flex items-center gap-3">
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
            
            {/* Dataset Provenance Status */}
            <div className={`flex items-center gap-2 px-3 py-0.5 rounded-full border text-xs font-semibold font-sans ${
              incidentContext?.loading 
                ? 'bg-muted text-muted-foreground border-border'
                : (incidentContext?.dataSources?.vessels === 'Simulated Demo' || incidentContext?.dataSources?.trajectory === 'Simulated Demo')
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  : 'bg-primary/10 border-primary/20 text-primary'
            }`}>
              {incidentContext?.loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <div className={`w-2 h-2 rounded-full ${
                  (incidentContext?.dataSources?.vessels === 'Simulated Demo' || incidentContext?.dataSources?.trajectory === 'Simulated Demo')
                    ? 'bg-amber-500'
                    : 'bg-primary'
                }`} />
              )}
              <span>
                {incidentContext?.loading 
                  ? 'LOADING...' 
                  : ((incidentContext?.dataSources?.vessels === 'Simulated Demo' || incidentContext?.dataSources?.trajectory === 'Simulated Demo') 
                      ? 'DEMO DATA' 
                      : 'LIVE DATA')}
              </span>
            </div>
          </>
        )}
      </div>
      
      {/* Right: Sidebar Toggle & Pill Theme Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="h-10 w-10 flex items-center justify-center rounded-full border border-border bg-card hover:bg-accent text-foreground transition-all duration-200 shadow-sm cursor-pointer"
          title={isCollapsed ? "Open Sidebar (Ctrl+B)" : "Close Sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Open Sidebar" : "Close Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
};
