// src/components/dashboard/RecentIncidents.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RecentIncident } from '../../types/dashboard';
import { ChevronRight } from 'lucide-react';

interface RecentIncidentsProps {
  incidents: RecentIncident[];
}

export const RecentIncidents: React.FC<RecentIncidentsProps> = ({ incidents }) => {
  const navigate = useNavigate();

  const handleRowClick = (spillId: string) => {
    navigate(`/live-map?spill_id=${spillId}`);
  };

  // Format ISO timestamps explicitly in UTC (Global Standard Time / Coordinated Universal Time)
  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mm = months[date.getUTCMonth()];
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const hh = String(date.getUTCHours()).padStart(2, '0');
      const min = String(date.getUTCMinutes()).padStart(2, '0');
      return `${mm} ${dd}, ${hh}:${min}`; // Removed the trailing 'UTC' suffix since it's in the header
    } catch {
      return isoString;
    }
  };

  // Status badge styling
  const getStatusBadge = (status: RecentIncident['status']) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border bg-blue-500/10 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
            NEW
          </span>
        );
      case 'REVIEW':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border bg-amber-500/10 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
            REVIEW
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border bg-slate-500/10 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  // Severity badge styling
  const getSeverityBadge = (severity: RecentIncident['severity']) => {
    switch (severity) {
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400">
            LOW
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400">
            {severity}
          </span>
        );
    }
  };

  // Filter out CLOSED cases — only show NEW and REVIEW (Active) alerts on dashboard
  const activeAlerts = incidents.filter(
    (incident) => incident.status === 'NEW' || incident.status === 'REVIEW'
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* Table Header Section */}
      <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-[#252830]">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
          Incidents
        </h3>
        <button
          onClick={() => navigate('/incidents')}
          className="text-xs font-bold text-[#0EA5E9] dark:text-[#00D9A6] hover:underline flex items-center gap-1 transition-colors"
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      {/* Table Area */}
      <div className="flex-1 p-5 overflow-x-auto overflow-y-auto max-h-[480px]">
        <table className="w-full border-collapse text-left border border-slate-200 dark:border-[#252830]">
          <thead>
            {/* Table header row styled with solid sea green background and white text */}
            <tr className="bg-[#0D9488] dark:bg-[#0D9488]/90 text-[11px] font-extrabold text-white uppercase tracking-wider h-12">
              <th className="px-5 font-bold border border-slate-200 dark:border-[#252830]">Location</th>
              <th className="px-5 font-bold border border-slate-200 dark:border-[#252830] w-[130px]">Time (UTC)</th>
              <th className="px-5 font-bold border border-slate-200 dark:border-[#252830] w-[100px]">Severity</th>
              <th className="px-5 font-bold text-center border border-slate-200 dark:border-[#252830] w-[80px]">CONF.</th>
              <th className="px-5 font-bold border border-slate-200 dark:border-[#252830] w-[100px]">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-800 dark:text-slate-300">
            {activeAlerts.slice(0, 4).map((incident) => {
              const confidencePercentage = Math.round(incident.confidence * 100);

              return (
                <tr
                  key={incident.spill_id}
                  onClick={() => handleRowClick(incident.spill_id)}
                  className="h-[72px] cursor-pointer hover:bg-slate-100/50 dark:hover:bg-[#252830] transition-colors duration-150"
                >
                  {/* Location */}
                  <td className="px-5 py-4 max-w-[240px] truncate border border-slate-200 dark:border-[#252830]">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {incident.location.name}
                    </div>
                  </td>
                  {/* Time (forced to single line with whitespace-nowrap) */}
                  <td className="px-5 py-4 text-xs font-semibold text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-[#252830] whitespace-nowrap">
                    {formatTimestamp(incident.timestamp)}
                  </td>
                  {/* Severity */}
                  <td className="px-5 py-4 border border-slate-200 dark:border-[#252830]">
                    {getSeverityBadge(incident.severity)}
                  </td>
                  {/* Confidence (Centered) */}
                  <td className="px-5 py-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-200 text-center border border-slate-200 dark:border-[#252830]">
                    {confidencePercentage}%
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4 border border-slate-200 dark:border-[#252830]">
                    {getStatusBadge(incident.status)}
                  </td>
                </tr>
              );
            })}
            {activeAlerts.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-xs text-slate-400 italic border border-slate-200 dark:border-[#252830]">
                  No active incidents at the moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default RecentIncidents;
