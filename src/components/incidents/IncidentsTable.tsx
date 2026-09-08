import React from 'react';
import { Incident } from '../../types/incident';
import { IncidentRow } from './IncidentRow';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface IncidentsTableProps {
  incidents: Incident[];
  onViewIncident: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const IncidentsTable: React.FC<IncidentsTableProps> = ({
  incidents,
  onViewIncident,
  loading = false,
  error = null,
  onRetry,
}) => {
  // Only show STATUS column if backend returns status field in the incidents
  const hasStatusColumn = incidents.some(
    (inc) => inc.status !== null && inc.status !== undefined && inc.status !== ''
  );
  const totalColumns = hasStatusColumn ? 5 : 4;

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-colors duration-200 font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-card border-b border-border text-muted-foreground text-[11px] uppercase font-mono tracking-wider">
              <th className="py-3 px-4 font-bold">DETECTED AT</th>
              <th className="py-3 px-4 font-bold">AREA</th>
              <th className="py-3 px-4 font-bold">CONFIDENCE</th>
              {hasStatusColumn && <th className="py-3 px-4 font-bold">STATUS</th>}
              <th className="py-3 px-4 text-right font-bold">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr>
                <td colSpan={totalColumns} className="px-5 py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-primary" size={32} strokeWidth={2} />
                    <span className="text-sm font-semibold text-foreground font-sans">Loading incident records...</span>
                  </div>
                </td>
              </tr>
            ) : error && incidents.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="px-5 py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="text-destructive" size={32} strokeWidth={1.5} />
                    <span className="text-sm font-semibold text-foreground font-sans">Failed to load incidents</span>
                    <span className="text-xs text-muted-foreground max-w-md">{error}</span>
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={14} />
                        <span>Retry Loading</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : incidents.length > 0 ? (
              incidents.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  hasStatusColumn={hasStatusColumn}
                  onViewClick={onViewIncident}
                />
              ))
            ) : (
              <tr>
                <td colSpan={totalColumns} className="px-5 py-16 text-center text-muted-foreground">
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


