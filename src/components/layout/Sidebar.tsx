import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Ship, 
  BarChart3, 
  FileText, 
  Video 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]">
          OS
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-sm">OCEAN SENTINEL</h1>
          <p className="text-[10px] text-cyan-400 tracking-wider">MARITIME INTELLIGENCE</p>
        </div>
      </div>
      
      <nav className="flex-1 py-4 space-y-1 px-2">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Main Menu</div>
        
        <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" to="/" />
        <SidebarItem icon={<Map size={18} />} label="Live Map" to="/live-map" />
        <SidebarItem icon={<AlertTriangle size={18} />} label="Incidents" to="/incidents" />
        <SidebarItem icon={<Ship size={18} />} label="Vessels" to="/vessels" />
        <SidebarItem icon={<BarChart3 size={18} />} label="Analytics" to="/analytics" />
        <SidebarItem icon={<FileText size={18} />} label="Reports" to="/reports" />
        
        <div className="mt-6 mb-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Investigation
        </div>
        <SidebarItem 
          icon={<Video size={18} />} 
          label="Incident Reconstruction" 
          to="/incident-reconstruction" 
        />
      </nav>
    </aside>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; to: string }> = ({ icon, label, to }) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => 
        `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
          isActive 
            ? 'bg-slate-800/80 text-cyan-400 border-l-2 border-cyan-400' 
            : 'hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
        }`
      }
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
};
