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
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-[0.5px]">
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
          <tbody className="divide-y divide-border">
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
                <td colSpan={9} className="px-5 py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="text-muted-foreground" size={32} strokeWidth={1.5} />
                    <span className="text-sm font-semibold text-foreground font-sans">No incidents matched your query.</span>
                    <span className="text-xs font-sans">Try adjusting your filters or search terms.</span>
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
