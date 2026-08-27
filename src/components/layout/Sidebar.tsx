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
    <aside className="w-[240px] bg-white border-r border-[#F0F0F0] dark:bg-[#13151D] dark:border-[#252830] flex flex-col h-full shrink-0 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#F0F0F0] dark:border-[#252830] flex items-center gap-3 transition-colors duration-200">
        <div className="w-8 h-8 rounded bg-[#00B894] dark:bg-[#00D9A6] flex items-center justify-center font-bold text-white shadow-[0_2px_8px_rgba(0,184,148,0.25)] dark:shadow-[0_2px_8px_rgba(0,217,166,0.25)] shrink-0">
          OS
        </div>
        <div>
          <h1 className="font-bold text-[#1A1D23] dark:text-[#F1F5F9] tracking-wide text-base leading-none">OCEAN SENTINEL</h1>
          <p className="text-[11px] text-[#9CA3AF] dark:text-[#64748B] tracking-[0.5px] uppercase font-semibold mt-0.5">MARITIME INTELLIGENCE</p>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-[4px]">
        <div className="text-[11px] font-bold text-[#9CA3AF] dark:text-[#64748B] uppercase tracking-[0.5px] mb-2 px-3">
          Main Menu
        </div>
        
        <SidebarItem icon={<LayoutDashboard size={18} strokeWidth={1.5} />} label="Dashboard" to="/" />
        <SidebarItem icon={<Map size={18} strokeWidth={1.5} />} label="Live Map" to="/live-map" />
        <SidebarItem icon={<AlertTriangle size={18} strokeWidth={1.5} />} label="Incidents" to="/incidents" />
        <SidebarItem icon={<Ship size={18} strokeWidth={1.5} />} label="Vessels" to="/vessels" />
        <SidebarItem icon={<BarChart3 size={18} strokeWidth={1.5} />} label="Analytics" to="/analytics" />
        <SidebarItem icon={<FileText size={18} strokeWidth={1.5} />} label="Reports" to="/reports" />
        
        <div className="mt-6 mb-2 px-3 text-[11px] font-bold text-[#9CA3AF] dark:text-[#64748B] uppercase tracking-[0.5px]">
          Investigation
        </div>
        <SidebarItem 
          icon={<Video size={18} strokeWidth={1.5} />} 
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
        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 ${
          isActive 
            ? 'bg-[rgba(0,184,148,0.06)] dark:bg-[rgba(0,217,166,0.1)] text-[#00B894] dark:text-[#00D9A6] border-l-[3px] border-[#00B894] dark:border-[#00D9A6] font-semibold' 
            : 'text-[#6B7280] hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#1A1D27]/50 hover:text-[#1A1D23] dark:hover:text-[#F1F5F9] border-l-[3px] border-transparent'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};
