// src/components/dashboard/SpillPreviewDrawer.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardContext } from '../../context/DashboardContext';
import { getSpillById } from '../../services/spillsApi';
import { SpillDetailRaw } from '../../types/spill';
import { formatArea, formatConfidence } from '../../utils/formatters';
import { formatDateTime } from '../../utils/dateUtils';
import { X, ExternalLink, Calendar, Waves, ShieldCheck, Ship, AlertCircle, ImageOff } from 'lucide-react';
import { DiagnosticPlotViewer } from '../common/DiagnosticPlotViewer';

export const SpillPreviewDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { selectedSpillId, setSelectedSpillId } = useDashboardContext();

  const [detail, setDetail] = useState<SpillDetailRaw | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedSpillId) {
      setDetail(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setImageError(false);

    getSpillById(selectedSpillId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err?.message || 'Failed to load incident detail.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSpillId]);

  if (!selectedSpillId) return null;

  const handleClose = () => {
    setSelectedSpillId(null);
  };

  const handleViewIncident = () => {
    setSelectedSpillId(null);
    navigate('/incidents');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-background/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-card">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Spill Incident Preview
              </span>
              <h2 className="text-lg font-mono font-extrabold text-primary">{selectedSpillId}</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="w-full h-48 bg-muted/60 rounded-xl" />
                <div className="h-6 bg-muted/80 rounded w-2/3" />
                <div className="h-4 bg-muted/40 rounded w-1/2" />
                <div className="h-24 bg-muted/50 rounded-xl" />
              </div>
            ) : error ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle size={16} />
                  <span>Failed to load detail</span>
                </div>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : detail ? (
              <>
                {/* Diagnostic Plot Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                      Diagnostic Drift Solution
                    </span>
                  </div>
                  <DiagnosticPlotViewer
                    spillId={detail.spill_id}
                    fallbackUrl={detail.image_url}
                    alt={`Diagnostic plot for ${detail.spill_id}`}
                    containerClassName="aspect-[4/3] w-full min-h-[220px]"
                    badgeText="Drift Diagnostic"
                  />
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-background/60 border border-border/60 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 font-medium">
                      <Calendar size={13} />
                      <span>Detected</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground font-mono">
                      {formatDateTime(detail.detected_at)}
                    </div>
                  </div>

                  <div className="p-3 bg-background/60 border border-border/60 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 font-medium">
                      <Waves size={13} />
                      <span>Surface Area</span>
                    </div>
                    <div className="text-xs font-bold text-foreground font-mono">
                      {formatArea(detail.area_km2)}
                    </div>
                  </div>

                  <div className="p-3 bg-background/60 border border-border/60 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 font-medium">
                      <ShieldCheck size={13} />
                      <span>Confidence</span>
                    </div>
                    <div className="text-xs font-bold text-primary font-mono">
                      {formatConfidence(detail.confidence_score)}
                    </div>
                  </div>

                  <div className="p-3 bg-background/60 border border-border/60 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 font-medium">
                      <Ship size={13} />
                      <span>Top Candidate</span>
                    </div>
                    <div className="text-xs font-mono text-foreground font-semibold truncate" title={detail.ranked_top_vessel || 'Not identified'}>
                      {detail.ranked_top_vessel || 'Not identified'}
                    </div>
                  </div>
                </div>

                {/* Additional Metadata */}
                <div className="p-4 bg-accent/40 border border-border/60 rounded-xl space-y-2 text-xs font-sans">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source Type:</span>
                    <span className="font-semibold text-foreground capitalize">{detail.source_type || 'Coast'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Age:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {detail.estimated_age_hours != null ? `${detail.estimated_age_hours.toFixed(1)} hrs` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Candidate Vessels:</span>
                    <span className="font-mono text-foreground font-semibold">{detail.candidate_count ?? 0}</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Drawer Footer Action */}
          <div className="p-5 border-t border-border bg-card">
            <button
              onClick={handleViewIncident}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-md hover:bg-primary/90 transition-all duration-150"
            >
              <span>View Full Incident Details</span>
              <ExternalLink size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
