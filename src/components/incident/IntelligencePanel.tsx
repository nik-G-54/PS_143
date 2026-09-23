import React from 'react';
import { IncidentInfoPanel } from './IncidentInfoPanel';
import { OpticalCorroborationCard } from './OpticalCorroborationCard';
import { SourceEstimateCard } from './SourceEstimateCard';
import { CandidateVesselPanel } from './CandidateVesselPanel';
import { EnvironmentPanel } from './EnvironmentPanel';

export const IntelligencePanel: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-3 pb-2">
      <IncidentInfoPanel />
      <OpticalCorroborationCard />
      <SourceEstimateCard />
      <CandidateVesselPanel />
      <EnvironmentPanel />
    </div>
  );
};
