import { useState } from 'react';
import { Anchor, ExternalLink, ImageOff, Send, X } from 'lucide-react';
import type { CoastGuardStation } from '../types/alertTypes';
import { formatLatLon } from '../utils/formatSpill';
import { formatKmAndNm } from '../utils/stationLinkText';
import { Field } from './sidebarModules';

interface StationCardProps {
  station: CoastGuardStation;
  /** Straight-line distance from the selected spill; null when no spill is selected. */
  distanceKm: number | null;
  /** Whether this is the nearest station to the selected spill — only then does "Send alert" make sense. */
  isNearest: boolean;
  onSendAlert?: () => void;
  onClose: () => void;
}

/** Only http(s) links are rendered as links; anything else in the data file shows as plain text. */
const isWebUrl = (value: string | undefined): value is string => Boolean(value && /^https?:\/\//i.test(value));

/** Panoramas read badly cropped to a card; show them whole instead. */
const WIDE_ASPECT = 2.2;

const CAPTION = 'text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground';
const LINK = 'inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline';

function Photo({ station }: { station: CoastGuardStation }) {
  const [failed, setFailed] = useState(false);
  const [wide, setWide] = useState(false);
  const hasPhoto = Boolean(station.photo) && !failed;

  if (!hasPhoto) {
    return (
      <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground">
        <ImageOff size={20} strokeWidth={1.5} aria-hidden />
        <span className="text-[11px]">No photo available</span>
      </div>
    );
  }

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-lg border border-border bg-muted">
        <img
          src={`${import.meta.env.BASE_URL}${station.photo}`}
          alt={station.photo_caption ?? `Photo related to ${station.name}`}
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            setWide(naturalHeight > 0 && naturalWidth / naturalHeight > WIDE_ASPECT);
          }}
          className={`block w-full ${wide ? 'h-auto object-contain' : 'aspect-[16/9] object-cover'}`}
        />
      </div>
      {station.photo_caption && (
        <figcaption className="mt-1.5 text-[11px] leading-snug text-foreground/90">{station.photo_caption}</figcaption>
      )}
      <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">
        Photo: {station.photo_author}, {station.photo_license}
        {isWebUrl(station.photo_source_url) && (
          <>
            {' · '}
            <a href={station.photo_source_url} target="_blank" rel="noopener noreferrer" className={LINK}>
              Source
            </a>
          </>
        )}
      </p>
    </figure>
  );
}

/** Detail card for one coast guard station — opened by clicking its marker on the map. */
export function StationCard({ station, distanceKm, isNearest, onSendAlert, onClose }: StationCardProps) {
  return (
    <section
      aria-label={`Coast guard station: ${station.name}`}
      className="maritime-panel-card pointer-events-auto flex min-h-0 w-[300px] flex-col overflow-hidden text-foreground"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
        <Anchor size={14} className="shrink-0 text-primary" aria-hidden />
        <span className={`min-w-0 flex-1 truncate ${CAPTION}`}>Coast guard station</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close station card"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X size={13} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <Photo key={station.id} station={station} />

        <div>
          <h3 className="text-[15px] font-semibold leading-snug">{station.name}</h3>
          {station.name_local && (
            <p lang="el" className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
              {station.name_local}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Field label="Organisation" value={station.organisation || '—'} />
          <Field label="Country" value={station.country || '—'} />
          <Field label="Position" value={formatLatLon(station.lon, station.lat)} />
          <Field label="To selected spill" value={distanceKm == null ? '—' : formatKmAndNm(distanceKm)} />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">Coordinates</span>
            <span className="text-right text-[11px] text-foreground">
              {station.coordinate_source === 'official' ? (
                'Official source'
              ) : station.coordinate_source === 'openstreetmap' ? (
                isWebUrl(station.coordinate_source_url) ? (
                  <a href={station.coordinate_source_url} target="_blank" rel="noopener noreferrer" className={LINK}>
                    OpenStreetMap <ExternalLink size={10} aria-hidden />
                  </a>
                ) : (
                  'OpenStreetMap'
                )
              ) : (
                '—'
              )}
            </span>
          </div>
        </div>

        {station.coordinate_note && (
          <p className="text-[10.5px] leading-relaxed text-muted-foreground">{station.coordinate_note}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-muted/30 px-3 py-3">
        {isWebUrl(station.source_url) && (
          <a
            href={station.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-card text-[12px] font-medium transition-colors hover:bg-accent"
          >
            Official page <ExternalLink size={12} aria-hidden />
          </a>
        )}
        {onSendAlert && isNearest ? (
          <button
            type="button"
            onClick={onSendAlert}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-primary bg-primary text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Send size={13} aria-hidden />
            Send alert
          </button>
        ) : (
          distanceKm != null && (
            <p className="text-center text-[10.5px] leading-snug text-muted-foreground">
              Not the nearest station to the selected spill, so alerts for it go elsewhere.
            </p>
          )
        )}
      </div>
    </section>
  );
}
