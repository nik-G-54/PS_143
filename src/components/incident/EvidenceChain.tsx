import React, { useMemo } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { Droplet, History, Target, Network, Ship } from 'lucide-react';

export const EvidenceChain: React.FC = () => {
  const { spillDetails, backtrackData, loading, error, vesselsData } = useIncident();

  const statuses = useMemo(() => {
    // 1. Oil Detected
    let oilStatus = 'not_run';
    if (loading && !spillDetails) oilStatus = 'pending';
    else if (spillDetails) oilStatus = 'available';

    // 2. Backtracked
    let backtrackStatus = 'not_run';
    if (loading) backtrackStatus = 'pending';
    else if (error) backtrackStatus = 'unavailable';
    else if (backtrackData?.backtrack?.trajectory && backtrackData.backtrack.trajectory.length > 0) backtrackStatus = 'available';

    // 3. Source Estimated
    let sourceStatus = 'not_run';
    if (loading) sourceStatus = 'pending';
    else if (backtrackData?.backtrack?.source_estimate?.latitude !== undefined) sourceStatus = 'available';
    else if (backtrackStatus === 'available') sourceStatus = 'unavailable';

    // 4. AIS Correlated
    let aisStatus = 'not_run';
    if (loading) aisStatus = 'pending';
    else if (vesselsData?.vessels && vesselsData.vessels.length > 0) aisStatus = 'available';
    else if (vesselsData?.vessels && vesselsData.vessels.length === 0) aisStatus = 'unavailable';

    // 5. Attribution
    let attrStatus = 'not_run';
    if (loading) attrStatus = 'pending';
    else if (backtrackData?.attribution?.top_vessel) attrStatus = 'available';
    else if (aisStatus === 'available') attrStatus = 'unavailable';

    return { oil: oilStatus, backtrack: backtrackStatus, source: sourceStatus, ais: aisStatus, attr: attrStatus };
  }, [spillDetails, backtrackData, loading, error, vesselsData]);

  const steps = [
    { id: 'oil', label: 'OIL DETECTED', icon: Droplet, status: statuses.oil },
    { id: 'backtrack', label: 'BACKTRACKED', icon: History, status: statuses.backtrack },
    { id: 'source', label: 'SOURCE ESTIMATED', icon: Target, status: statuses.source },
    { id: 'ais', label: 'AIS CORRELATED', icon: Network, status: statuses.ais },
    { id: 'attr', label: 'ATTRIBUTION', icon: Ship, status: statuses.attr }
  ];

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'available': return 'text-primary border-primary bg-primary/10';
      case 'pending': return 'text-amber-400 border-amber-400/50 bg-amber-400/10 animate-pulse';
      case 'unavailable': return 'text-destructive border-destructive/50 bg-destructive/10';
      case 'not_run': default: return 'text-muted-foreground border-border bg-muted/20';
    }
  };

  return (
    <div className="w-full bg-sidebar/80 border-b border-border py-1.5 px-4 overflow-x-auto shrink-0 custom-scrollbar z-10">
      <div className="flex items-center justify-between min-w-[640px] gap-2 max-w-4xl mx-auto">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${getStatusClasses(step.status)} transition-colors`}
            >
              <step.icon size={11} />
              <span className="text-[9px] font-bold tracking-wider whitespace-nowrap">{step.label}</span>
            </div>
            {idx < steps.length - 1 && <div className="flex-1 h-px bg-border min-w-[12px]" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
