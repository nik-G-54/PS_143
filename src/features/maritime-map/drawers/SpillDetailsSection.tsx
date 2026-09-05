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

/** Scroll-down investigation evidence: metadata, satellite image, scientific chart, vessels. */
export function SpillDetailsSection({
  spill,
  trajectory,
  environment,
  attribution,
  isTrajectoryLoading,
  isAttributionLoading,
  currentTimeMs,
  backtrackActive,
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
            Satellite observation and the backend drift solution for this detection. Vessel ranking
            and AIS tracks appear after Backtrack is started on the map.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Meta label="Detected" value={formatDetectedAt(spill)} />
          <Meta label="Area" value={formatArea(spill.areaKm2)} />
          <Meta label="Detection conf." value={formatConfidence(spill.confidenceScore)} />
          <Meta label="Candidates" value={formatCandidates(spill.candidateCount)} />
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
                    value={formatUncertaintyRadius(trajectory.source?.radiusKm ?? null)}
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
              Ranked vessels
            </p>
            {!backtrackActive && (
              <p className="text-[11px] text-muted-foreground">
                Start Backtrack on the map to load AIS attribution.
              </p>
            )}
          </div>

          {backtrackActive && isAttributionLoading && (
            <p className="text-sm text-muted-foreground">Loading ranked vessels…</p>
          )}

          {backtrackActive && attribution && attribution.vessels.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Rank</th>
                    <th className="px-3 py-2 font-semibold">Vessel</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Flag</th>
                    <th className="px-3 py-2 font-semibold">Origin dist.</th>
                    <th className="px-3 py-2 font-semibold">AIS track</th>
                  </tr>
                </thead>
                <tbody>
                  {attribution.vessels.map((vessel) => (
                    <tr key={vessel.vesselId} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 font-mono tabular-nums">#{vessel.rank}</td>
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
                        {vessel.distanceFromOriginKm != null
                          ? `${vessel.distanceFromOriginKm.toFixed(2)} km`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                        {vessel.track.length > 0 ? `${vessel.track.length} pts` : 'No track'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {backtrackActive && !isAttributionLoading && attribution?.vessels.length === 0 && (
            <p className="text-sm text-muted-foreground">No ranked vessels returned for this spill.</p>
          )}
        </div>
      </div>
    </section>
  );
}
