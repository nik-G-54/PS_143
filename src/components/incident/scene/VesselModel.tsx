import React, { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { useSimulation } from '../../../context/SimulationContext';
import { useIncident } from '../../../context/IncidentContext';
import { latLonToWorld, VESSEL_SURFACE_OFFSET, METERS_PER_WORLD_UNIT } from '../../../utils/coordinates';
import { resolveVesselPosition } from '../../../utils/vesselTrack';
import { VesselCandidate } from '../../../types/api';

interface VesselModelProps {
  id: string;
  status: string;
  candidate?: VesselCandidate;
  isLegacyMock?: boolean;
}

export const VesselModel: React.FC<VesselModelProps> = ({ id, status, candidate, isLegacyMock }) => {
  const { progress, direction } = useSimulation();
  const { spillDetails, backtrackData } = useIncident();
  
  const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  // Use candidate ID if available
  const displayId = candidate?.vessel_id ?? id;
  const isTopCandidate = candidate?.rank === 1;
  const isSelected = useIncident().selectedVesselId === candidate?.vessel_id;

  // Calculate current position and heading based on progress
  const currentData = useMemo(() => {
    // If backend provided a track, use the chronological interpolator
    if (candidate && candidate.track && backtrackData) {
      const startTimeMs = Date.parse(backtrackData.backtrack.estimated_release_time);
      const endTimeMs = Date.parse(backtrackData.backtrack.observation.timestamp);
      const resolved = resolveVesselPosition(candidate.track, progress, startTimeMs, endTimeMs, direction);
      if (resolved) {
        return { lat: resolved.latitude, lng: resolved.longitude, heading: resolved.heading };
      }
    }
    
    return null;
  }, [progress, candidate, backtrackData, direction]);

  // Calculate source estimate relationship line
  const sourceLinePoints = useMemo(() => {
    if (!currentData) return null;
    const worldPos = latLonToWorld(currentData.lat, currentData.lng, originLat, originLon);

    if ((isSelected || isTopCandidate) && backtrackData?.backtrack.source_estimate) {
      const sourcePos = latLonToWorld(
        backtrackData.backtrack.source_estimate.latitude,
        backtrackData.backtrack.source_estimate.longitude,
        originLat,
        originLon
      );
      // Return relative points from the vessel's current position group
      return [
        [0, 0, 0] as [number, number, number],
        [sourcePos.x - worldPos.x, 0, sourcePos.z - worldPos.z] as [number, number, number]
      ];
    }
    return null;
  }, [isSelected, isTopCandidate, backtrackData, currentData, originLat, originLon]);

  if (!currentData) return null;

  const worldPos = latLonToWorld(currentData.lat, currentData.lng, originLat, originLon);
  const position: [number, number, number] = [worldPos.x, worldPos.y + VESSEL_SURFACE_OFFSET, worldPos.z];
  const rotationY = -currentData.heading * (Math.PI / 180);

  // Highlighting materials
  const hullColor = isSelected ? "#0ea5e9" : (isTopCandidate ? "#38bdf8" : "#334155");
  const hullEmissive = isSelected ? "#0284c7" : (isTopCandidate ? "#0369a1" : "#000000");
  const hullEmissiveIntensity = isSelected ? 0.5 : (isTopCandidate ? 0.3 : 0);
  
  const bridgeColor = isSelected ? "#bae6fd" : "#cbd5e1";

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      
      {/* Source Relationship Line */}
      {sourceLinePoints && (
        <group rotation={[0, -rotationY, 0]}>
          <Line 
            points={sourceLinePoints} 
            color={isSelected ? "#0ea5e9" : "#38bdf8"} 
            lineWidth={1.5}
            dashed={true}
            dashScale={5}
            dashSize={2}
            dashOffset={progress * 10}
            opacity={0.5}
            transparent
          />
        </group>
      )}
      
      {/* Top Candidate Highlight Ring */}
      {isTopCandidate && !isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -VESSEL_SURFACE_OFFSET + 0.1, 0]}>
          <ringGeometry args={[3, 3.5, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={2} />
        </mesh>
      )}

      {/* Selected Candidate Highlight Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -VESSEL_SURFACE_OFFSET + 0.1, 0]}>
          <ringGeometry args={[3.5, 4.5, 32]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.8} side={2} />
        </mesh>
      )}

      {/* Main Hull */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 6]} />
        <meshStandardMaterial color={hullColor} emissive={hullEmissive} emissiveIntensity={hullEmissiveIntensity} roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Bow */}
      <mesh position={[0, 0.5, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.75, 1, 4]} />
        <meshStandardMaterial color={hullColor} emissive={hullEmissive} emissiveIntensity={hullEmissiveIntensity} roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Bridge */}
      <mesh position={[0, 1.5, 2]}>
        <boxGeometry args={[1.2, 1, 1.5]} />
        <meshStandardMaterial color={bridgeColor} roughness={0.3} metalness={0.5} />
      </mesh>
      
      {/* Stack */}
      <mesh position={[0, 2.25, 2.3]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 8]} />
        <meshStandardMaterial color="#ef4444" roughness={0.8} />
      </mesh>

      {/* Label */}
      <group rotation={[0, -rotationY, 0]}>
        <Html position={[0, 4, 0]} center zIndexRange={[100, 0]} distanceFactor={40}>
          <div className={`px-2 py-1 rounded flex flex-col items-center pointer-events-none backdrop-blur-sm shadow-[0_0_10px_rgba(8,145,178,0.3)] border ${
            isSelected ? 'bg-sky-900/90 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 
            (isTopCandidate ? 'bg-slate-900/90 border-sky-500/80' : 'bg-slate-900/70 border-slate-500/50')
          }`}>
            <span className={`text-[10px] font-mono font-bold tracking-widest whitespace-nowrap ${
              isSelected ? 'text-sky-300' : (isTopCandidate ? 'text-cyan-300' : 'text-slate-300')
            }`}>{displayId}</span>
            {isTopCandidate && <span className="text-[7px] text-sky-400 font-bold tracking-widest uppercase mt-0.5">Top Candidate</span>}
            {!isTopCandidate && status && <span className="text-[8px] text-slate-400 font-mono tracking-widest mt-0.5">{status}</span>}
          </div>
        </Html>
      </group>
    </group>
  );
};
