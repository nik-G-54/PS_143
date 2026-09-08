import React, { useMemo, useRef, useState } from 'react';
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useSimulation } from '../../../context/SimulationContext';
import { useIncident } from '../../../context/IncidentContext';
import { useInteraction } from '../../../context/InteractionContext';
import { latLonToWorld, VESSEL_SURFACE_OFFSET } from '../../../utils/coordinates';
import { resolveVesselPosition } from '../../../utils/vesselTrack';
import { VesselCandidate } from '../../../types/api';
import { getWaveFollowPose } from '../../../systems/ocean';

interface VesselModelProps {
  id: string;
  status: string;
  candidate?: VesselCandidate;
  isLegacyMock?: boolean;
}

export const VesselModel: React.FC<VesselModelProps> = ({ id, status, candidate }) => {
  const { progress, direction } = useSimulation();
  const { spillDetails, backtrackData, setSelectedVesselId, selectedVesselId } = useIncident();
  const { setSelectedObject } = useInteraction();
  const groupRef = useRef<Group | null>(null);
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);
  const geoRef = useRef<{ x: number; z: number; headingY: number } | null>(null);
  const [hovered, setHovered] = useState(false);

  const originLat = backtrackData?.backtrack.observation.latitude ?? spillDetails?.centroid?.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? spillDetails?.centroid?.longitude ?? 0;

  const displayId = candidate?.vessel_id ?? id;
  const displayName = candidate?.vessel_name || displayId;
  const matchPct =
    typeof candidate?.score === 'number' ? `${(candidate.score * 100).toFixed(0)}% match` : null;
  const distKm =
    typeof candidate?.distance_to_origin_km === 'number'
      ? `${candidate.distance_to_origin_km.toFixed(2)} km`
      : null;
  const isTopCandidate = candidate?.rank === 1;
  const isSelected = selectedVesselId === candidate?.vessel_id;
  const isMock = Boolean(candidate?.is_mock);

  const currentData = useMemo(() => {
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

  const worldPos = useMemo(() => {
    if (!currentData) return null;
    return latLonToWorld(currentData.lat, currentData.lng, originLat, originLon);
  }, [currentData, originLat, originLon]);

  const rotationY = currentData ? -currentData.heading * (Math.PI / 180) : 0;

  useFrame(() => {
    if (worldPos) {
      geoRef.current = { x: worldPos.x, z: worldPos.z, headingY: rotationY };
    } else {
      geoRef.current = null;
    }
    const g = groupRef.current;
    const geo = geoRef.current;
    if (!g || !geo) return;
    const pose = getWaveFollowPose(geo.x, geo.z, VESSEL_SURFACE_OFFSET);
    g.position.set(geo.x, pose.y, geo.z);
    g.rotation.set(pose.pitch * 0.65, geo.headingY, pose.roll * 0.65);
  });

  const sourceLinePoints = useMemo(() => {
    if (!worldPos) return null;
    if ((isSelected || isTopCandidate) && backtrackData?.backtrack.source_estimate) {
      const sourcePos = latLonToWorld(
        backtrackData.backtrack.source_estimate.latitude,
        backtrackData.backtrack.source_estimate.longitude,
        originLat,
        originLon
      );
      return [
        [0, 0, 0] as [number, number, number],
        [sourcePos.x - worldPos.x, 0, sourcePos.z - worldPos.z] as [number, number, number],
      ];
    }
    return null;
  }, [isSelected, isTopCandidate, backtrackData, worldPos, originLat, originLon]);

  if (!currentData || !worldPos) return null;

  const hullColor = isSelected ? '#0ea5e9' : isTopCandidate ? '#38bdf8' : '#475569';
  const hullEmissive = isSelected ? '#0284c7' : isTopCandidate ? '#0369a1' : '#000000';
  const hullEmissiveIntensity = isSelected ? 0.55 : isTopCandidate ? 0.35 : 0;
  const bridgeColor = isSelected ? '#bae6fd' : isTopCandidate ? '#cbd5e1' : '#94a3b8';
  const scale = isTopCandidate || isSelected ? 1 : 0.72;
  const showDetailCard = isSelected;
  const showHoverTip = hovered && !isSelected;
  const showRankBadge = isTopCandidate && !isSelected;

  const handlePointerDown = (e: any) => {
    clickStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    if (!clickStartRef.current) return;
    const dx = e.clientX - clickStartRef.current.x;
    const dy = e.clientY - clickStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      e.stopPropagation();
      setSelectedVesselId(displayId);
      setSelectedObject({ type: 'vessel', id: displayId });
    }
    clickStartRef.current = null;
  };

  return (
    <group
      position={[worldPos.x, worldPos.y + VESSEL_SURFACE_OFFSET, worldPos.z]}
      rotation={[0, rotationY, 0]}
      scale={scale}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      ref={groupRef}
    >
      {sourceLinePoints && (
        <group rotation={[0, -rotationY, 0]}>
          <Line
            points={sourceLinePoints}
            color={isSelected ? '#0ea5e9' : '#38bdf8'}
            lineWidth={isTopCandidate ? 2 : 1.2}
            dashed={true}
            dashScale={5}
            dashSize={2}
            dashOffset={progress * 10}
            opacity={isTopCandidate ? 0.55 : 0.35}
            transparent
          />
        </group>
      )}

      {isTopCandidate && !isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -VESSEL_SURFACE_OFFSET + 0.1, 0]}>
          <ringGeometry args={[3, 3.5, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} side={2} />
        </mesh>
      )}

      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -VESSEL_SURFACE_OFFSET + 0.1, 0]}>
          <ringGeometry args={[3.5, 4.5, 32]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.8} side={2} />
        </mesh>
      )}

      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 6]} />
        <meshStandardMaterial
          color={hullColor}
          emissive={hullEmissive}
          emissiveIntensity={hullEmissiveIntensity}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      <mesh position={[0, 0.5, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.75, 1, 4]} />
        <meshStandardMaterial
          color={hullColor}
          emissive={hullEmissive}
          emissiveIntensity={hullEmissiveIntensity}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {(isTopCandidate || isSelected) && (
        <>
          <mesh position={[0, 1.5, 2]}>
            <boxGeometry args={[1.2, 1, 1.5]} />
            <meshStandardMaterial color={bridgeColor} roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, 2.25, 2.3]}>
            <cylinderGeometry args={[0.2, 0.2, 1, 8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.8} />
          </mesh>
        </>
      )}

      <group rotation={[0, -rotationY, 0]}>
        {showRankBadge && (
          <Html position={[0, 4.8, 0]} center zIndexRange={[100, 0]} distanceFactor={52}>
            <div className="pointer-events-none flex flex-col items-center">
              <div className="bg-sky-950/85 border border-sky-400/70 px-1.5 py-0.5 rounded shadow-md backdrop-blur-sm">
                <div className="text-[8px] font-bold tracking-widest text-sky-300 whitespace-nowrap">
                  RANK #1
                </div>
                <div className="text-[7px] font-semibold tracking-wide text-cyan-200/90 whitespace-nowrap">
                  Potential Source
                </div>
                {distKm && (
                  <div className="text-[7px] font-mono text-slate-300 text-center mt-0.5">{distKm}</div>
                )}
              </div>
            </div>
          </Html>
        )}

        {showHoverTip && (
          <Html position={[0, 4.2, 0]} center zIndexRange={[110, 0]} distanceFactor={48}>
            <div className="pointer-events-none bg-slate-950/90 border border-slate-500/50 px-2 py-1 rounded backdrop-blur-sm shadow-md max-w-[140px]">
              <div className="text-[9px] font-mono text-slate-100 whitespace-nowrap truncate">
                {displayName}
              </div>
              <div className="text-[7px] text-slate-400 tracking-wider mt-0.5">
                {isTopCandidate ? 'Top Candidate' : 'Candidate Vessel'}
                {matchPct ? ` · ${matchPct}` : ''}
              </div>
              {isMock && (
                <div className="text-[7px] text-amber-400/90 font-mono tracking-widest mt-0.5">
                  MOCK DATA
                </div>
              )}
            </div>
          </Html>
        )}

        {showDetailCard && (
          <Html position={[0, 5.2, 0]} center zIndexRange={[120, 0]} distanceFactor={45}>
            <div className="pointer-events-none bg-sky-950/92 border border-sky-400/70 px-2.5 py-1.5 rounded-md backdrop-blur-sm shadow-[0_0_14px_rgba(14,165,233,0.35)] min-w-[120px]">
              <div className="text-[10px] font-mono font-bold text-sky-200 tracking-wide whitespace-nowrap">
                {displayName}
              </div>
              {displayName !== displayId && (
                <div className="text-[7px] text-slate-400 font-mono mt-0.5">{displayId}</div>
              )}
              <div className="text-[8px] text-cyan-300 font-semibold tracking-wider mt-1 uppercase">
                {isTopCandidate ? 'Rank #1 · Potential Source' : status || 'Candidate'}
              </div>
              {matchPct && (
                <div className="text-[8px] text-slate-300 font-mono mt-0.5">{matchPct}</div>
              )}
              {distKm && (
                <div className="text-[8px] text-slate-300 font-mono mt-0.5">{distKm} to source</div>
              )}
              {isMock && (
                <div className="text-[7px] text-amber-400 font-mono tracking-widest mt-1">MOCK DATA</div>
              )}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};
