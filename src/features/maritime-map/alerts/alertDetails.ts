// Builds the drill-alert content shown in the preview modal, put in the email
// and used for the mailto fallback. One builder feeds all three so they can
// never disagree. Anything the data doesn't have renders as "—" — never a guess.

import type { MapSpill } from '../types/spillTypes';
import type { AttributedVessel, SpillAttribution } from '../types/attributionTypes';
import type { NearestStation } from '../types/alertTypes';
import { ALERT_SEVERITY_LABEL, type AlertSeverity, type CoastalAssessment } from '../utils/coastalAlert';
import { formatArea, formatConfidence, formatDetectedAt, formatLatLon } from '../utils/formatSpill';

export const DRILL_BANNER = 'DRILL — Historical replay. Not an operational alert.';
export const EM_DASH = '—';

export interface AlertRow {
  label: string;
  value: string;
}

export interface AlertDetails {
  spillId: string;
  stationId: string | null;
  /** Official local-language station name, shown as a secondary line in the preview. */
  stationLocalName?: string | null;
  /** Flat label/value list — the source of truth for the email body and mailto draft. */
  rows: AlertRow[];
  /** Typed extras so the preview can colour the severity and lay out the vessel; same data as `rows`. */
  severity: AlertSeverity | null;
  vessel: { name: string; matchScore: string | null; synthetic: boolean } | null;
}

export interface BuildAlertDetailsInput {
  spill: MapSpill;
  nearest: NearestStation | null;
  /** Null when no forecast/coastline is available (or still loading). */
  assessment: CoastalAssessment | null;
  attribution: SpillAttribution | null;
}

/** First non-mock candidate in the adapter's rank order — the same pick the vessels panel leads with. */
export function pickTopVessel(attribution: SpillAttribution | null): AttributedVessel | null {
  return attribution?.vessels.find((vessel) => !vessel.isMock) ?? null;
}

function formatEta(assessment: CoastalAssessment | null): string {
  if (!assessment) return EM_DASH;
  if (assessment.etaHours === null) return 'No landfall ETA (drift effectively stalled)';
  if (!Number.isFinite(assessment.etaHours)) return EM_DASH;
  return `~${assessment.etaHours.toFixed(1)} h`;
}

function formatVessel(vessel: AttributedVessel | null): string {
  if (!vessel) return EM_DASH;
  const parts = [vessel.vesselName || EM_DASH];
  if (vessel.score != null) parts.push(`match score ${formatConfidence(vessel.score)}`);
  // Never present generated placeholder identifiers as a real registry identity.
  if (vessel.identifiersSynthetic) parts.push('synthetic identifiers');
  return parts.join(' · ');
}

export function buildAlertDetails({
  spill,
  nearest,
  assessment,
  attribution,
}: BuildAlertDetailsInput): AlertDetails {
  const station = nearest?.station ?? null;
  const topVessel = pickTopVessel(attribution);
  const hasPosition = Number.isFinite(spill.latitude) && Number.isFinite(spill.longitude);

  return {
    spillId: spill.spillId,
    stationId: station?.id ?? null,
    stationLocalName: station?.name_local ?? null,
    severity: assessment?.severity ?? null,
    vessel: topVessel
      ? {
          name: topVessel.vesselName || EM_DASH,
          matchScore: topVessel.score != null ? formatConfidence(topVessel.score) : null,
          synthetic: topVessel.identifiersSynthetic,
        }
      : null,
    rows: [
      { label: 'Nearest station', value: station?.name || EM_DASH },
      { label: 'Organisation', value: station?.organisation || EM_DASH },
      {
        label: 'Straight-line distance',
        value: nearest ? `${nearest.distanceKm.toFixed(1)} km` : EM_DASH,
      },
      { label: 'Spill ID', value: spill.spillId },
      {
        label: 'Position',
        value: hasPosition ? formatLatLon(spill.longitude, spill.latitude) : EM_DASH,
      },
      { label: 'Area', value: formatArea(spill.areaKm2) },
      { label: 'Detection confidence', value: formatConfidence(spill.confidenceScore) },
      { label: 'Detected', value: formatDetectedAt(spill) },
      {
        label: 'Coastal severity',
        value: assessment ? ALERT_SEVERITY_LABEL[assessment.severity] : EM_DASH,
      },
      { label: 'Coastal ETA', value: formatEta(assessment) },
      { label: 'Top candidate vessel', value: formatVessel(topVessel) },
      {
        label: 'Attribution qualification',
        value: attribution?.attributionQualification || EM_DASH,
      },
    ],
  };
}

/** `a***@domain` — enough to recognise the inbox without printing the whole address on screen. */
export function maskEmail(address: string): string {
  const at = address.indexOf('@');
  return at > 0 ? `${address[0]}***${address.slice(at)}` : address;
}

export const rowValue = (details: AlertDetails, label: string): string =>
  details.rows.find((r) => r.label === label)?.value ?? EM_DASH;

export function buildAlertSubject(details: AlertDetails): string {
  return `[DRILL] Oil spill alert — ${details.spillId}`;
}

/** Plain-text body: the drill banner first and last, every row of the preview between. */
export function buildAlertBody(details: AlertDetails): string {
  return [
    DRILL_BANNER,
    '',
    ...details.rows.map((r) => `${r.label}: ${r.value}`),
    '',
    'Straight-line distance is great-circle, not a sailing distance.',
    DRILL_BANNER,
  ].join('\n');
}

/**
 * Variables handed to the EmailJS template. `message` carries the whole plain
 * text body so a minimal template ({{message}}) is enough; the individual
 * fields are there for templates that lay the content out themselves.
 */
export function buildEmailParams(details: AlertDetails, recipient: string): Record<string, string> {
  return {
    to_email: recipient,
    subject: buildAlertSubject(details),
    drill_banner: DRILL_BANNER,
    spill_id: details.spillId,
    station_name: rowValue(details, 'Nearest station'),
    station_organisation: rowValue(details, 'Organisation'),
    station_distance_km: rowValue(details, 'Straight-line distance'),
    position: rowValue(details, 'Position'),
    area: rowValue(details, 'Area'),
    confidence: rowValue(details, 'Detection confidence'),
    detected_at: rowValue(details, 'Detected'),
    coastal_severity: rowValue(details, 'Coastal severity'),
    coastal_eta: rowValue(details, 'Coastal ETA'),
    top_vessel: rowValue(details, 'Top candidate vessel'),
    attribution_qualification: rowValue(details, 'Attribution qualification'),
    message: buildAlertBody(details),
  };
}

/** `recipient` may be empty when the env var is unset — the mail client then opens with a blank To. */
export function buildMailtoUrl(details: AlertDetails, recipient: string): string {
  const query = `subject=${encodeURIComponent(buildAlertSubject(details))}&body=${encodeURIComponent(
    buildAlertBody(details)
  )}`;
  return `mailto:${encodeURIComponent(recipient)}?${query}`;
}
