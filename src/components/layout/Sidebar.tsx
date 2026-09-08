import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Video,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside 
      className={`relative bg-sidebar border-r border-border flex flex-col h-full shrink-0 transition-all duration-300 z-40 select-none ${
        isCollapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Floating edge toggle button on sidebar border rail */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-5 z-50 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer hover:scale-105 active:scale-95"
        title={isCollapsed ? "Open sidebar" : "Close sidebar"}
        aria-label={isCollapsed ? "Open sidebar" : "Close sidebar"}
      >
        {isCollapsed ? <ChevronRight size={13} strokeWidth={2.5} /> : <ChevronLeft size={13} strokeWidth={2.5} />}
      </button>

      {/* Official Brand Header */}
      <div className={`p-3.5 border-b border-border flex items-center transition-all duration-300 ${
        isCollapsed ? 'justify-center' : 'px-4'
      }`}>
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Custom Combined Vector Logo */}
          <button
            type="button"
            onClick={isCollapsed ? toggleSidebar : undefined}
            className={`w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0 border border-primary/40 ${
              isCollapsed ? 'hover:opacity-90 hover:scale-105 transition-all cursor-pointer' : ''
            }`}
            title={isCollapsed ? "Click to open sidebar" : undefined}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 4.5H9.5L12 2Z" fill="currentColor" />
              <path d="M6.5 5.5C10 4 14 4 17.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
              <line x1="12" y1="4.5" x2="12" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
              <path d="M4.5 12.5L6.5 16H17.5L19.5 12.5H4.5Z" fill="currentColor" />
              <path d="M10 9.5H14V12.5H10V9.5Z" fill="currentColor" />
              <path d="M2.5 19C6 17 9.5 20.5 13 18.5C16.5 16.5 19.5 19 21.5 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          
          {/* Brand Title: NAUKA */}
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
              <h1 className="font-sans font-[900] tracking-[0.16em] text-2xl uppercase leading-none select-none">
                <span className="text-primary font-black">N</span>
                <span className="text-foreground font-black">AUKA</span>
              </h1>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-[4px]">
        <SidebarItem icon={<LayoutDashboard size={18} strokeWidth={1.5} />} label="Dashboard" to="/" isCollapsed={isCollapsed} />
        <SidebarItem icon={<Map size={18} strokeWidth={1.5} />} label="Maritime Map" to="/maritime-map" isCollapsed={isCollapsed} />
        <SidebarItem icon={<AlertTriangle size={18} strokeWidth={1.5} />} label="Incidents" to="/incidents" isCollapsed={isCollapsed} />
        <SidebarItem 
          icon={<Video size={18} strokeWidth={1.5} />} 
          label="3D Incident Reconstruction" 
          to="/incident-reconstruction" 
          isCollapsed={isCollapsed}
        />
      </nav>

      {/* Footer Toggle Button */}
      <div className="p-2 border-t border-border mt-auto">
        <button
          type="button"
          onClick={toggleSidebar}
          className={`w-full flex items-center gap-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-sans cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
          title={isCollapsed ? "Open sidebar" : "Close sidebar"}
          aria-label={isCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          <span className="shrink-0">
            {isCollapsed ? <PanelLeftOpen size={18} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
          </span>
          {!isCollapsed && (
            <span className="whitespace-nowrap overflow-hidden text-ellipsis text-xs font-medium">
              Collapse Sidebar
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; to: string; isCollapsed?: boolean }> = ({ 
  icon, 
  label, 
  to, 
  isCollapsed 
}) => {
  return (
    <NavLink 
      to={to}
      title={isCollapsed ? label : undefined}
      className={({ isActive }) => 
        `flex items-center gap-3 py-2.5 rounded-md text-sm transition-all duration-150 font-sans ${
          isCollapsed ? 'justify-center px-0' : 'px-3'
        } ${
          isActive 
            ? 'bg-primary/10 text-primary border-l-[3px] border-primary font-semibold' 
            : 'text-muted-foreground hover:bg-accent hover:text-foreground border-l-[3px] border-transparent'
        }`
      }
    >
      <span className="shrink-0">{icon}</span>
      {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>}
    </NavLink>
  );
};
