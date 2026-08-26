import React from 'react';
import { mockIncident } from '../../data/mockIncident';
import { AlertCircle, Ship } from 'lucide-react';

export const IncidentInfoPanel: React.FC = () => {
  const { id, status, detectedAt, location, confidence, vessel } = mockIncident;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col shadow-lg">
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <AlertCircle size={16} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-200 tracking-wider">INCIDENT DETAILS</h3>
      </div>
      
      <div className="p-4 space-y-4 text-sm flex-1 overflow-y-auto">
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500 font-medium text-xs tracking-wider">INCIDENT</span>
          <span className="text-cyan-400 font-mono font-bold">{id}</span>
        </div>
        
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500 font-medium text-xs tracking-wider">STATUS</span>
          <span className="text-red-400 font-bold text-xs tracking-wider">{status}</span>
        </div>
        
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500 font-medium text-xs tracking-wider">DETECTED</span>
          <div className="text-right">
            <div className="text-slate-200 font-mono">{detectedAt.split(' ')[0]} {detectedAt.split(' ')[1]} {detectedAt.split(' ')[2]}</div>
            <div className="text-slate-400 font-mono text-xs">{detectedAt.split(' ')[3]} {detectedAt.split(' ')[4]}</div>
          </div>
        </div>
        
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500 font-medium text-xs tracking-wider">LOCATION</span>
          <span className="text-slate-200">{location.name}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-2">
          <div>
            <span className="block text-slate-500 text-[10px] tracking-wider mb-1">LATITUDE</span>
            <span className="text-slate-300 font-mono text-xs bg-slate-800 px-2 py-1 rounded">{location.lat}° N</span>
          </div>
          <div>
            <span className="block text-slate-500 text-[10px] tracking-wider mb-1">LONGITUDE</span>
            <span className="text-slate-300 font-mono text-xs bg-slate-800 px-2 py-1 rounded">{location.lng}° E</span>
          </div>
        </div>
        
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500 font-medium text-xs tracking-wider">CONFIDENCE</span>
          <span className="text-green-400 font-mono font-bold">{confidence}%</span>
        </div>

        <div className="mt-4 pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Ship size={14} className="text-cyan-500" />
            <span className="text-slate-400 font-semibold text-xs tracking-wider">SUSPECTED VESSEL</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">NAME</span>
              <span className="text-slate-200 font-medium text-xs">{vessel.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">TYPE</span>
              <span className="text-slate-300 text-xs">{vessel.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">IMO</span>
              <span className="text-cyan-400 font-mono text-xs">{vessel.imo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
