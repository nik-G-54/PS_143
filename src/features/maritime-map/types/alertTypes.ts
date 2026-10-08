// Drill-alert contracts for the maritime map. Frontend-only: nothing here is
// sent to or received from the backend.

/** One entry of `public/data/coast-guard-stations.json`. */
export interface CoastGuardStation {
  id: string;
  /** Display name, English. */
  name: string;
  /** Official name in the local language (e.g. Greek), shown as a secondary line. */
  name_local?: string;
  organisation: string;
  country: string;
  lat: number;
  lon: number;
  /** Official page that lists the station (name / existence). */
  source_url: string;
  /** Where lat/lon came from: the official source itself, or a geocode in OpenStreetMap. */
  coordinate_source?: 'official' | 'openstreetmap';
  /** The OSM feature the coordinates were taken from (for "openstreetmap"), or the official page. */
  coordinate_source_url?: string;
  /** Plain-language precision caveat, e.g. "port-level, building not mapped". */
  coordinate_note?: string;

  // Optional licensed photo. All of photo / photo_author / photo_license /
  // photo_source_url are present together or the validator drops the photo.
  /** Local path under public/, e.g. "data/station-photos/hcg-sfakion.jpg". Never a remote URL. */
  photo?: string;
  /** What the picture actually shows, e.g. "Hora Sfakion harbour (not the station building)". */
  photo_caption?: string;
  photo_author?: string;
  /** e.g. "CC BY-SA 4.0". */
  photo_license?: string;
  /** Commons (or other) page for the file, where the licence and author can be checked. */
  photo_source_url?: string;
}

export interface NearestStation {
  station: CoastGuardStation;
  /** Straight-line (great-circle) distance from the spill, km — not a sailing distance. */
  distanceKm: number;
}

export type AlertChannel = 'emailjs' | 'mailto';

/** Only what actually happened — there is deliberately no "Acknowledged"/"Delivered" state. */
export type AlertStatus = 'Sent' | 'Failed';

export interface AlertLogEntry {
  spill_id: string;
  station_id: string;
  sent_at: string;
  channel: AlertChannel;
  status: AlertStatus;
}
