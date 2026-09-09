import type { MapSpill } from '../types/spillTypes';
import type { SpillTrajectory, SpillEnvironment } from '../types/trajectoryTypes';
import type { SpillAttribution } from '../types/attributionTypes';
import {
  formatArea,
  formatCandidates,
  formatConfidence,
  formatCoordinates,
  formatDetectedAt,
  formatLatLon,
  formatUtcTimestamp,
} from '../utils/formatSpill';
import {
  formatDistanceKm,
  formatDriftWindow,
  formatUncertaintyRadius,
} from '../utils/formatTrajectory';
import { TrajectoryChart } from '../charts/TrajectoryChart';
import { DiagnosticPlotViewer } from '../../../components/common/DiagnosticPlotViewer';

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
  const sourceLon = trajectory?.source?.longitude ?? spill.estimatedSourceLongitude;
  const sourceLat = trajectory?.source?.latitude ?? spill.estimatedSourceLatitude;
  const sourceRadius = trajectory?.source?.radiusKm ?? spill.estimatedSourceRadiusKm;
  const releaseTime = spill.estimatedReleaseTime
    ? formatUtcTimestamp(Date.parse(spill.estimatedReleaseTime))
    : trajectory?.points[0]
    ? formatUtcTimestamp(trajectory.points[0].timestampMs)
    : '—';

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
            Satellite observation, authoritative slick geometry, and hydrographic drift solution for this detection.
            Candidate vessels and AIS telemetry are ranked according to spatio-temporal proximity to the probable release point.
          </p>
        </header>

        {/* Incident telemetry grid */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Meta label="Detected" value={formatDetectedAt(spill)} />
          <Meta label="Area" value={formatArea(spill.areaKm2)} />
          <Meta label="Detection conf." value={formatConfidence(spill.confidenceScore)} />
          <Meta label="Candidates" value={formatCandidates(spill.candidateCount)} />
          <Meta label="Centroid" value={formatCoordinates(spill)} />
          <Meta
            label="Estimated age"
            value={spill.estimatedAgeHours != null ? `${spill.estimatedAgeHours.toFixed(1)} h` : '—'}
          />
          <Meta label="Source type" value={spill.sourceType ?? '—'} />
          <Meta
            label="Probable source"
            value={sourceLon != null && sourceLat != null ? formatLatLon(sourceLon, sourceLat) : '—'}
          />
          <Meta
            label="Source uncertainty"
            value={formatUncertaintyRadius(sourceRadius)}
          />
          <Meta label="Est. release" value={releaseTime} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Satellite / Drift Diagnostic observation */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Drift Diagnostic & Satellite Evidence
            </p>
            <DiagnosticPlotViewer
              spillId={spill.spillId}
              fallbackUrl={spill.imageUrl}
              alt={`Drift diagnostic plot for ${spill.spillId}`}
              containerClassName="aspect-[4/3] w-full max-h-[360px]"
              badgeText="Drift Diagnostic"
            />
          </div>

          {/* Drift metrics */}
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

        {/* Ranked Candidate Vessels table */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Candidate Vessels (AIS Attribution)
            </p>
            {!backtrackActive && (
              <p className="text-[11px] text-muted-foreground">
                Start investigation on map to animate correlated vessel tracks.
              </p>
            )}
          </div>

          {isAttributionLoading && (
            <p className="text-sm text-muted-foreground">Loading candidate vessels…</p>
          )}

          {!isAttributionLoading && attribution && attribution.vessels.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Rank</th>
                    <th className="px-3 py-2 font-semibold">Candidate Vessel</th>
                    <th className="px-3 py-2 font-semibold">MMSI</th>
                    <th className="px-3 py-2 font-semibold">IMO</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Flag</th>
                    <th className="px-3 py-2 font-semibold">Speed</th>
                    <th className="px-3 py-2 font-semibold">Heading</th>
                    <th className="px-3 py-2 font-semibold">Origin Dist.</th>
                    <th className="px-3 py-2 font-semibold">Time Diff.</th>
                  </tr>
                </thead>
                <tbody>
                  {attribution.vessels.map((vessel, idx) => {
                    const rankNum = vessel.rank > 0 && vessel.rank < 999 ? vessel.rank : idx + 1;
                    return (
                      <tr key={vessel.vesselId} className="border-b border-border/60 last:border-0 hover:bg-muted/10">
                        <td className="px-3 py-2 font-mono tabular-nums">#{rankNum}</td>
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs font-semibold">{vessel.vesselName}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs tabular-nums text-foreground">
                          {vessel.mmsi ?? '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs tabular-nums text-foreground">
                          {vessel.imo ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {vessel.vesselType ?? '—'}
                          {vessel.isMock ? ' · synth' : ''}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{vessel.country ?? '—'}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                          {vessel.speed != null ? `${vessel.speed.toFixed(1)} kn` : '—'}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                          {vessel.heading != null
                            ? `${Math.round(vessel.heading)}°`
                            : vessel.course != null
                            ? `${Math.round(vessel.course)}°`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                          {vessel.distanceFromOriginKm != null
                            ? `${vessel.distanceFromOriginKm.toFixed(2)} km`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                          {vessel.timeDifferenceHours != null
                            ? `${vessel.timeDifferenceHours > 0 ? '+' : ''}${vessel.timeDifferenceHours.toFixed(1)} h`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isAttributionLoading && (!attribution || attribution.vessels.length === 0) && (
            <p className="text-sm text-muted-foreground">No candidate vessels recorded for this spill.</p>
          )}
        </div>
      </div>
    </section>
  );
}