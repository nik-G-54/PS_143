import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory, SpillEnvironment } from '../types/trajectoryTypes';
import type { SpillAttribution } from '../types/attributionTypes';
import {
  formatArea,
  formatCandidates,
  formatConfidence,
  formatCoordinates,
  formatDetectedAt,
} from '../utils/formatSpill';
import { formatDistanceKm, formatDriftWindow, formatUncertaintyRadius } from '../utils/formatTrajectory';
import { TrajectoryChart } from '../charts/TrajectoryChart';

interface SpillDetailsSectionProps {
  spill: MapSpill;
  trajectory: SpillTrajectory | null;
  environment: SpillEnvironment | null;
  attribution: SpillAttribution | null;
  isTrajectoryLoading: boolean;
  isAttributionLoading: boolean;
  currentTimeMs: number | null;
  backtrackActive: boolean;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function formatUtcTime(timestamp: string | null | undefined): string {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;
  } catch {
    return timestamp;
  }
}

/** Scroll-down investigation evidence: metadata, satellite image, scientific chart, vessels. */
export function SpillDetailsSection({
  spill,
  trajectory,
  environment,
  attribution,
  isTrajectoryLoading,
  isAttributionLoading,
  currentTimeMs,
}: SpillDetailsSectionProps) {
  return (
    <section
      id="spill-investigation-details"
      className="maritime-details-section border-t border-border bg-background"
    >
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Selected incident
          </p>
          <h2 className="font-mono text-xl font-semibold text-primary">{spill.spillId}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Satellite observation, backtrack drift analysis, and correlated AIS candidate vessels
            for this detection.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Meta label="Detected" value={formatDetectedAt(spill)} />
          <Meta label="Area" value={formatArea(spill.areaKm2)} />
          <Meta label="Detection conf." value={formatConfidence(spill.confidenceScore)} />
          <Meta
            label="Candidates"
            value={formatCandidates(attribution?.candidateCount ?? spill.candidateCount)}
          />
          <Meta label="Centroid" value={formatCoordinates(spill)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Satellite observation
            </p>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {spill.imageUrl ? (
                <img
                  src={spill.imageUrl}
                  alt={`Satellite observation for ${spill.spillId}`}
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-xs text-muted-foreground">
                  No satellite image for this detection.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Drift metrics
            </p>
            <div className="rounded-lg border border-border bg-card/80 p-4">
              {isTrajectoryLoading && (
                <p className="text-sm text-muted-foreground">Solving drift path…</p>
              )}
              {!isTrajectoryLoading && trajectory && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Meta label="Backtracked" value={formatDriftWindow(trajectory.durationHours)} />
                  <Meta label="Path length" value={formatDistanceKm(trajectory.totalDistanceKm)} />
                  <Meta label="Positions" value={String(trajectory.points.length)} />
                  <Meta
                    label="Origin uncertainty"
                    value={formatUncertaintyRadius(
                      attribution?.backtrackOrigin?.radiusKm ?? trajectory.source?.radiusKm ?? null
                    )}
                  />
                  {environment?.wind && (
                    <Meta
                      label="Wind"
                      value={`${environment.wind.speed.toFixed(1)} ${environment.wind.unit} @ ${environment.wind.directionDeg.toFixed(0)}°`}
                    />
                  )}
                  {environment?.current && (
                    <Meta
                      label="Current"
                      value={`${environment.current.speed.toFixed(2)} ${environment.current.unit} @ ${environment.current.directionDeg.toFixed(0)}°`}
                    />
                  )}
                </div>
              )}
              {!isTrajectoryLoading && !trajectory && (
                <p className="text-sm text-muted-foreground">No drift trajectory for this detection.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Scientific trajectory
          </p>
          <TrajectoryChart trajectory={trajectory} currentTimeMs={currentTimeMs} />
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Ranked AIS candidates
            </p>
            {attribution && (
              <p className="text-[11px] text-muted-foreground">
                {attribution.candidateCount} candidate{attribution.candidateCount === 1 ? '' : 's'} correlated with backtrack origin
              </p>
            )}
          </div>

          {isAttributionLoading && (
            <p className="text-sm text-muted-foreground">Loading ranked vessels…</p>
          )}

          {!isAttributionLoading && attribution && attribution.vessels.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Rank</th>
                    <th className="px-3 py-2 font-semibold">Vessel</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Flag</th>
                    <th className="px-3 py-2 font-semibold">Origin dist.</th>
                    <th className="px-3 py-2 font-semibold">Attribution Position</th>
                    <th className="px-3 py-2 font-semibold">AIS display track</th>
                  </tr>
                </thead>
                <tbody>
                  {attribution.vessels.map((vessel) => {
                    const isTop = vessel.rank === 1;
                    const culpritTime = vessel.culpritLocation?.timestamp
                      ? formatUtcTime(vessel.culpritLocation.timestamp)
                      : '—';
                    return (
                      <tr
                        key={vessel.vesselId}
                        className={`border-b border-border/60 last:border-0 ${
                          isTop ? 'bg-amber-500/10 font-medium' : ''
                        }`}
                      >
                        <td className="px-3 py-2 font-mono tabular-nums">
                          <span
                            className={
                              isTop
                                ? 'rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-semibold text-amber-400'
                                : ''
                            }
                          >
                            #{vessel.rank}
                            {isTop ? ' ★ Top Candidate' : ''}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs font-semibold">{vessel.vesselName}</div>
                          {vessel.mmsi && (
                            <div className="text-[10px] text-muted-foreground">MMSI {vessel.mmsi}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {vessel.vesselType ?? '—'}
                          {vessel.isMock ? ' · synth' : ''}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{vessel.country ?? '—'}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                          {vessel.distanceFromBacktrackOriginKm != null
                            ? `${vessel.distanceFromBacktrackOriginKm.toFixed(2)} km`
                            : vessel.distanceFromOriginKm != null
                              ? `${vessel.distanceFromOriginKm.toFixed(2)} km`
                              : '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {isTop && vessel.culpritLocation
                            ? `Potential Source Position (${culpritTime})`
                            : culpritTime}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                          {vessel.trajectory.length > 0
                            ? `${vessel.trajectory.length} pts`
                            : vessel.track.length > 0
                              ? `${vessel.track.length} pts`
                              : 'No track'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isAttributionLoading && (!attribution || attribution.vessels.length === 0) && (
            <p className="text-sm text-muted-foreground">No ranked vessels returned for this spill.</p>
          )}
        </div>
      </div>
    </section>
  );
}
