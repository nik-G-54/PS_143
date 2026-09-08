import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useIncident } from '../../../context/IncidentContext';
import { latLonToWorld, VESSEL_SURFACE_OFFSET } from '../../../utils/coordinates';

/**
 * Marks where Rank #1 was at the estimated release time (backend culprit_location).
 * Display uses scientifically safe "Potential Source" terminology.
 */
export const CulpritMarker: React.FC = () => {
  const { backtrackData, vesselsData } = useIncident();

  const topCandidate = vesselsData?.vessels?.find((v) => v.rank === 1 && v.culprit_location);
  const originLat = backtrackData?.backtrack.observation.latitude ?? 0;
  const originLon = backtrackData?.backtrack.observation.longitude ?? 0;

  const culpritLat = topCandidate?.culprit_location?.latitude;
  const culpritLon = topCandidate?.culprit_location?.longitude;

  const pos = useMemo(() => {
    if (typeof culpritLat !== 'number' || typeof culpritLon !== 'number') return null;
    return latLonToWorld(culpritLat, culpritLon, originLat, originLon);
  }, [culpritLat, culpritLon, originLat, originLon]);

  if (!topCandidate || !pos) return null;

  const distLabel =
    typeof topCandidate.distance_to_origin_km === 'number'
      ? `${topCandidate.distance_to_origin_km.toFixed(2)} km`
      : null;

  return (
    <group position={[pos.x, VESSEL_SURFACE_OFFSET + 0.1, pos.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.35, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} side={2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.9} />
      </mesh>
      <Html position={[0, 1.6, 0]} center zIndexRange={[95, 0]} distanceFactor={50}>
        <div className="pointer-events-none bg-sky-950/85 border border-sky-400/50 px-1.5 py-0.5 rounded backdrop-blur-sm flex flex-col items-center">
          <span className="text-[8px] text-sky-300 font-bold tracking-widest whitespace-nowrap">
            POTENTIAL SOURCE
          </span>
          {distLabel && (
            <span className="text-[7px] text-slate-300 font-mono mt-0.5 whitespace-nowrap">
              {distLabel}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};
