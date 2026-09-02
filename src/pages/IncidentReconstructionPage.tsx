import React from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { SimulationViewport } from '../components/incident/SimulationViewport';
import { IncidentInfoPanel } from '../components/incident/IncidentInfoPanel';
import { EnvironmentPanel } from '../components/incident/EnvironmentPanel';
import { MapPreview } from '../components/incident/MapPreview';
import { GlobePreview } from '../components/incident/GlobePreview';
import { Timeline } from '../components/incident/Timeline';
import { SimulationProvider } from '../context/SimulationContext';

export const IncidentReconstructionPage: React.FC = () => {
  return (
    <SimulationProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
        <Sidebar />
      
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          
          <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
            {/* Main Simulation Area */}
            <div className="flex-1 min-h-[400px] lg:min-h-0 relative">
              <SimulationViewport />
            </div>
            
            {/* Right Side Panels */}
            <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
              <IncidentInfoPanel />
              <EnvironmentPanel />
              <div className="grid grid-cols-2 gap-4 h-40 shrink-0">
                <MapPreview />
                <GlobePreview />
              </div>
            </div>
          </div>
          
          <Timeline />
        </main>
      </div>
    </SimulationProvider>
  );
};
