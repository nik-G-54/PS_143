import React from 'react';
import { Incident } from '../../types/incident';
import { IncidentRow } from './IncidentRow';
import { AlertCircle } from 'lucide-react';

interface IncidentsTableProps {
  incidents: Incident[];
  onViewIncident: (id: string) => void;
}

export const IncidentsTable: React.FC<IncidentsTableProps> = ({
  incidents,
  onViewIncident,
}) => {
  return (
    <div className="w-full bg-white dark:bg-[#1A1D27] border border-[#F0F0F0] dark:border-[#252830] rounded-xl overflow-hidden shadow-none transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFBFC] dark:bg-[#1E2130] border-b border-[#F0F0F0] dark:border-[#252830] text-[11px] font-bold text-[#9CA3AF] dark:text-[#64748B] uppercase tracking-[0.5px]">
              <th className="px-5 py-3.5 h-12 font-semibold">Incident ID</th>
              <th className="px-5 py-3.5 h-12 font-semibold">Date</th>
              <th className="px-5 py-3.5 h-12 font-semibold">Location</th>
              <th className="px-5 py-3.5 h-12 font-semibold">Status</th>
              <th className="px-5 py-3.5 h-12 font-semibold">Confidence</th>
              <th className="px-5 py-3.5 h-12 font-semibold">Severity</th>
              <th className="px-5 py-3.5 h-12 font-semibold">Vessel Involved</th>
              <th className="px-5 py-3.5 h-12 font-semibold">Spill Area</th>
              <th className="px-5 py-3.5 h-12 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0] dark:divide-[#252830]">
            {incidents.length > 0 ? (
              incidents.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  onViewClick={onViewIncident}
                />
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-5 py-16 text-center text-[#9CA3AF] dark:text-[#64748B]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="text-[#9CA3AF] dark:text-[#64748B]" size={32} strokeWidth={1.5} />
                    <span className="text-sm font-semibold">No incidents matched your query.</span>
                    <span className="text-xs">Try adjusting your filters or search terms.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
