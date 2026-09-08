// src/components/investigation/TopCandidateVessel.tsx

import React, { useState, useEffect } from 'react';
import { Ship, Anchor } from 'lucide-react';
import { CandidateVesselRaw, getSpillVessels } from '../../services/spillsApi';
import { LoaderOne } from '../ui/loader-one';

interface TopCandidateVesselProps {
  spillId: string;
}

// Convert 2-letter ISO country code to flag emoji
const getCountryFlagEmoji = (code?: string | null): string => {
  if (!code || code.length !== 2) return '🌐';
  const upper = code.toUpperCase();
  const first = upper.charCodeAt(0);
  const second = upper.charCodeAt(1);
  if (first < 65 || first > 90 || second < 65 || second > 90) return '🌐';
  return String.fromCodePoint(127397 + first, 127397 + second);
};

export const TopCandidateVessel: React.FC<TopCandidateVesselProps> = ({ spillId }) => {
  const [vessels, setVessels] = useState<CandidateVesselRaw[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getSpillVessels(spillId)
      .then((data) => {
        if (mounted) {
          setVessels(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [spillId]);

  // Find top ranked vessel or vessel with highest score
  const topVessel =
    vessels.find((v) => v.rank === 1) ||
    [...vessels].sort((a, b) => (b.score || 0) - (a.score || 0))[0] ||
    null;

  if (loading) {
    return (
      <div className="bg-card/60 p-6 rounded-xl border border-border flex flex-col items-center justify-center gap-3 text-xs font-mono text-muted-foreground">
        <LoaderOne size="md" />
        <span>Correlating Vessel Telemetry (AIS)...</span>
      </div>
    );
  }

  if (!topVessel) {
    return (
      <div className="bg-card/60 p-4 rounded-xl border border-border flex flex-col items-center justify-center gap-1 text-center text-xs font-mono text-muted-foreground">
        <Ship size={20} className="text-muted-foreground/50" />
        <span>No candidate vessels correlated for this incident</span>
      </div>
    );
  }

  const flagEmoji = getCountryFlagEmoji(topVessel.country);

  return (
    <div className="flex flex-col gap-3 w-full bg-card/60 p-4 rounded-xl border border-border font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Anchor size={16} className="text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Top Candidate Vessel Details
          </span>
        </div>
      </div>

      {/* Vessel Name Header Banner */}
      <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider">
            Vessel Name
          </div>
          <div className="text-sm font-black text-foreground font-mono mt-0.5">
            {topVessel.vessel_name || topVessel.vessel_id}
          </div>
        </div>
        {topVessel.country && (
          <span className="px-2.5 py-1 text-xs font-bold font-mono bg-muted text-foreground border border-border rounded flex items-center gap-1.5 uppercase">
            <span className="text-base leading-none">{flagEmoji}</span>
            <span>Flag: {topVessel.country}</span>
          </span>
        )}
      </div>

      {/* Detailed Tabular View */}
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <tbody>
            <tr className="border-b border-border/60 hover:bg-muted/30">
              <td className="py-2 px-3 text-muted-foreground font-sans font-semibold bg-muted/20 w-5/12">
                Flag State / Country
              </td>
              <td className="py-2 px-3 font-bold text-foreground flex items-center gap-1.5">
                <span className="text-base leading-none">{flagEmoji}</span>
                <span>{topVessel.country ? `${topVessel.country}` : 'N/A'}</span>
              </td>
            </tr>
            <tr className="border-b border-border/60 hover:bg-muted/30">
              <td className="py-2 px-3 text-muted-foreground font-sans font-semibold bg-muted/20">
                MMSI Number
              </td>
              <td className="py-2 px-3 font-bold text-foreground">
                {topVessel.mmsi || 'N/A'}
              </td>
            </tr>
            <tr className="border-b border-border/60 hover:bg-muted/30">
              <td className="py-2 px-3 text-muted-foreground font-sans font-semibold bg-muted/20">
                IMO Number
              </td>
              <td className="py-2 px-3 font-bold text-foreground">
                {topVessel.imo || 'N/A'}
              </td>
            </tr>
            <tr className="border-b border-border/60 hover:bg-muted/30">
              <td className="py-2 px-3 text-muted-foreground font-sans font-semibold bg-muted/20">
                Ship Type
              </td>
              <td className="py-2 px-3 font-bold text-foreground">
                {topVessel.vessel_type || topVessel.shiptype_name || 'Cargo'}
              </td>
            </tr>
            <tr className="border-b border-border/60 hover:bg-muted/30">
              <td className="py-2 px-3 text-muted-foreground font-sans font-semibold bg-muted/20">
                Speed
              </td>
              <td className="py-2 px-3 font-bold text-foreground">
                {topVessel.speed != null ? `${topVessel.speed.toFixed(2)} knots` : 'N/A'}
              </td>
            </tr>
            <tr className="border-b border-border/60 hover:bg-muted/30">
              <td className="py-2 px-3 text-muted-foreground font-sans font-semibold bg-muted/20">
                Heading / Course
              </td>
              <td className="py-2 px-3 font-bold text-foreground">
                {topVessel.heading != null ? `${topVessel.heading.toFixed(1)}°` : 'N/A'}
                {topVessel.course != null && topVessel.course !== topVessel.heading && (
                  <span className="text-muted-foreground font-normal ml-1">
                    (Course: {topVessel.course.toFixed(1)}°)
                  </span>
                )}
              </td>
            </tr>
            <tr className="border-b border-border/60 hover:bg-muted/30">
              <td className="py-2 px-3 text-muted-foreground font-sans font-semibold bg-muted/20">
                Distance to Origin
              </td>
              <td className="py-2 px-3 font-bold text-foreground">
                {topVessel.distance_to_origin_km != null ? `${topVessel.distance_to_origin_km.toFixed(2)} km` : 'N/A'}
              </td>
            </tr>
            {topVessel.time_difference_hours != null && (
              <tr className="hover:bg-muted/30">
                <td className="py-2 px-3 text-muted-foreground font-sans font-semibold bg-muted/20">
                  Time Difference
                </td>
                <td className="py-2 px-3 font-bold text-foreground">
                  {topVessel.time_difference_hours.toFixed(1)} hours
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
