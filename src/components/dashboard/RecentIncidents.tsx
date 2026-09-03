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

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mm = months[date.getUTCMonth()];
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const hh = String(date.getUTCHours()).padStart(2, '0');
      const min = String(date.getUTCMinutes()).padStart(2, '0');
      return `${mm} ${dd}, ${hh}:${min}`;
    } catch {
      return isoString;
    }
  };

  // Distinct Status Colors (NEW: Terracotta Primary, REVIEW: Amethyst Violet)
  const getStatusBadge = (status: RecentIncident['status']) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border-2 border-[#c96442] bg-[#c96442]/15 text-[#c96442] dark:border-[#d97757] dark:bg-[#d97757]/20 dark:text-[#d97757] font-sans shadow-xs">
            NEW
          </span>
        );
      case 'REVIEW':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border-2 border-[#7c3aed] bg-[#7c3aed]/15 text-[#7c3aed] dark:border-[#9c87f5] dark:bg-[#9c87f5]/25 dark:text-[#9c87f5] font-sans shadow-xs">
            REVIEW
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border-2 border-border bg-muted text-muted-foreground font-sans shadow-xs">
            {status}
          </span>
        );
    }
  };

  // Distinct Severity Colors (HIGH: Orange, MEDIUM: Golden Yellow, LOW: Cool Slate)
  const getSeverityBadge = (severity: RecentIncident['severity']) => {
    switch (severity) {
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border-2 border-[#ea580c] bg-[#ea580c]/15 text-[#ea580c] dark:border-[#f97316] dark:bg-[#f97316]/20 dark:text-[#f97316] font-sans shadow-xs">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border-2 border-[#ca8a04] bg-[#ca8a04]/15 text-[#ca8a04] dark:border-[#facc15] dark:bg-[#facc15]/20 dark:text-[#facc15] font-sans shadow-xs">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border-2 border-[#64748b] bg-[#64748b]/15 text-[#475569] dark:border-[#94a3b8] dark:bg-[#64748b]/20 dark:text-[#94a3b8] font-sans shadow-xs">
            LOW
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full border-2 border-border bg-muted text-muted-foreground font-sans shadow-xs">
            {severity}
          </span>
        );
    }
  };

  const activeAlerts = incidents.filter(
    (incident) => incident.status === 'NEW' || incident.status === 'REVIEW'
  );

  return (
    <div className="flex flex-col h-full w-full bg-card">
      {/* Table Header Section */}
      <div className="p-5 flex items-center justify-between border-b border-border">
        <h3 className="text-base font-bold text-foreground font-sans">
          Incidents
        </h3>
        <button
          onClick={() => navigate('/incidents')}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-colors font-sans"
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      {/* Table Area */}
      <div className="flex-1 p-5 overflow-x-hidden overflow-y-auto max-h-[480px]">
        <table className="w-full table-fixed border-collapse text-left border border-border">
          <thead>
            {/* Table header row styled with Claude Amber primary background */}
            <tr className="bg-primary text-primary-foreground text-[11px] font-extrabold uppercase tracking-wider h-12">
              <th className="px-3 font-bold border border-primary/20 font-sans w-[30%]">Location</th>
              <th className="px-3 font-bold border border-primary/20 font-sans w-[25%]">Time (UTC)</th>
              <th className="px-3 font-bold border border-primary/20 font-sans w-[16%]">Severity</th>
              <th className="px-3 font-bold text-center border border-primary/20 font-sans w-[13%]">CONF.</th>
              <th className="px-3 font-bold border border-primary/20 font-sans w-[16%]">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-foreground">
            {activeAlerts.slice(0, 4).map((incident) => {
              const confidencePercentage = Math.round(incident.confidence * 100);

              return (
                <tr
                  key={incident.spill_id}
                  onClick={() => handleRowClick(incident.spill_id)}
                  className="h-[72px] cursor-pointer hover:bg-accent/50 transition-colors duration-150 border-b border-border"
                >
                  <td className="px-3 py-3 border border-border truncate" title={incident.location.name}>
                    <div className="font-bold text-foreground font-sans truncate">
                      {incident.location.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold text-muted-foreground border border-border whitespace-nowrap font-mono">
                    {formatTimestamp(incident.timestamp)}
                  </td>
                  <td className="px-3 py-3 border border-border">
                    {getSeverityBadge(incident.severity)}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs font-bold text-foreground text-center border border-border">
                    {confidencePercentage}%
                  </td>
                  <td className="px-3 py-3 border border-border">
                    {getStatusBadge(incident.status)}
                  </td>
                </tr>
              );
            })}
            {activeAlerts.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-xs text-muted-foreground italic border border-border font-sans">
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
