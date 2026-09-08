// src/components/investigation/InvestigationDock.tsx

import React from 'react';
import { useDashboardContext } from '../../context/DashboardContext';
import { useInvestigationPreview } from '../../hooks/useInvestigationPreview';
import { SpillTrajectory } from './SpillTrajectory';
import { EnvironmentSummary } from './EnvironmentSummary';
import { DetectionEvidence } from './DetectionEvidence';
import { TopCandidateVessel } from './TopCandidateVessel';
import { LoaderOne } from '../ui/loader-one';
import { X, AlertCircle } from 'lucide-react';

export const InvestigationDock: React.FC = () => {
  const { selectedSpillId, setSelectedSpillId } = useDashboardContext();

  const { data, isLoading, error } = useInvestigationPreview(selectedSpillId);

  if (!selectedSpillId) return null;

  const handleClose = () => {
    setSelectedSpillId(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-background/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Right Slide-in Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
          {/* Drawer Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-card shrink-0">
            <h2 className="text-lg font-mono font-extrabold text-foreground tracking-tight">
              Investigation Preview
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-muted-foreground font-mono flex flex-col items-center gap-4">
                <LoaderOne size="lg" />
                <span>Loading investigation visualization...</span>
              </div>
            ) : error ? (
              <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center text-xs font-sans text-destructive space-y-2">
                <AlertCircle size={24} className="mx-auto" />
                <div className="font-bold">Unable to load investigation preview</div>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : data ? (
              <>
                {/* 1. Estimated Spill Path */}
                <SpillTrajectory trajectory={data.trajectory} />

                {/* 2. Environment Summary */}
                <EnvironmentSummary environment={data.environment} />

                {/* 3. Detection Evidence (SAR / Diagnostic Imagery) */}
                <DetectionEvidence imageUrl={data.imageUrl} spillId={data.spillId} />

                {/* 4. Top Candidate Vessel & Telemetry Details */}
                <TopCandidateVessel spillId={selectedSpillId} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
