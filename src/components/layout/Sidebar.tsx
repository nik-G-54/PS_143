import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Video,
  Scan,
  Box,
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
          {/* Maritime Vessel Official Logo */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-sm shrink-0 border border-primary/30 ring-2 ring-primary/20 bg-background/50 hover:opacity-90 hover:scale-105 transition-all cursor-pointer p-0.5"
              title="Click to open sidebar"
            >
              <img 
                src="/logo.png" 
                alt="NAUKA Maritime Intelligence" 
                className="w-full h-full object-contain rounded-full select-none"
              />
            </button>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-3 group focus:outline-none"
              title="NAUKA Maritime Intelligence"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-sm shrink-0 border border-primary/30 ring-2 ring-primary/20 bg-background/50 group-hover:scale-105 transition-all p-0.5">
                <img 
                  src="/logo.png" 
                  alt="NAUKA Maritime Intelligence" 
                  className="w-full h-full object-contain rounded-full select-none"
                />
              </div>
              <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
                <h1 className="font-sans font-[900] tracking-[0.16em] text-2xl uppercase leading-none select-none">
                  <span className="text-primary font-black">N</span>
                  <span className="text-foreground font-black">AUKA</span>
                </h1>
              </div>
            </Link>
          )}
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-[4px]">
        <SidebarItem icon={<LayoutDashboard size={18} strokeWidth={1.5} />} label="Dashboard" to="/" isCollapsed={isCollapsed} />
        <SidebarItem icon={<Map size={18} strokeWidth={1.5} />} label="Maritime Map" to="/maritime-map" isCollapsed={isCollapsed} />
        <SidebarItem 
          icon={<Scan size={18} strokeWidth={1.5} />} 
          label="Test Your Image" 
          to="/test-image" 
          isCollapsed={isCollapsed}
        />
        {/* <SidebarItem 
          icon={<Video size={18} strokeWidth={1.5} />} 
          label="3D Incident Reconstruction" 
          to="/incident-reconstruction" 
          isCollapsed={isCollapsed}
        /> */}
        <SidebarItem 
          icon={<Box size={18} strokeWidth={1.5} />} 
          label="3D Visualisation" 
          to="/3d-visualisation" 
          isCollapsed={isCollapsed}
        />
        <SidebarItem icon={<AlertTriangle size={18} strokeWidth={1.5} />} label="Incidents" to="/incidents" isCollapsed={isCollapsed} />
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
