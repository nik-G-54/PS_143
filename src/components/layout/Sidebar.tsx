import React, { useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database,
  Map, 
  Scan,
  Box,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', to: '/', icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
  { id: 'maritime-map', label: 'Maritime Map', to: '/maritime-map', icon: <Map size={18} strokeWidth={1.5} /> },
  { id: 'test-image', label: 'Test Your Image', to: '/test-image', icon: <Scan size={18} strokeWidth={1.5} /> },
  { id: '3d-vis', label: '3D Visualisation', to: '/3d-visualisation', icon: <Box size={18} strokeWidth={1.5} /> },
  { id: 'incident-overview', label: 'Incident Overview', to: '/incident-overview', icon: <Database size={18} strokeWidth={1.5} /> },
];

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const location = useLocation();

  // Calculate current active nav index for the blue right-notch indicator
  const activeIndex = useMemo(() => {
    const idx = NAV_ITEMS.findIndex(item => {
      if (item.to === '/') return location.pathname === '/' || location.pathname === '/dashboard';
      return location.pathname.startsWith(item.to);
    });
    return idx >= 0 ? idx : 0;
  }, [location.pathname]);

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
      <nav className="relative flex-1 py-4 px-2 overflow-y-auto space-y-[4px]">
        {/* Active Row Indicator with Smooth Spring & Blue Right Notch */}
        <div 
          className="absolute left-2 right-2 h-[42px] bg-primary/10 rounded-md transition-transform duration-380 ease-[cubic-bezier(0.34,1.16,0.42,1)] pointer-events-none z-0"
          style={{ 
            transform: `translateY(${activeIndex * 46}px)`,
            opacity: activeIndex >= 0 ? 1 : 0 
          }}
        >
          {/* Blue Right Side Radius Notch Pill */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-4 rounded-l-md bg-primary shadow-sm" />
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink 
            key={item.id}
            to={item.to}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) => 
              `relative z-10 flex items-center gap-3 h-[42px] rounded-md text-sm transition-colors duration-150 font-sans ${
                isCollapsed ? 'justify-center px-0' : 'px-3'
              } ${
                isActive 
                  ? 'text-primary font-semibold' 
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
          </NavLink>
        ))}
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
