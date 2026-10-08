import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Anchor, Check, Loader2, RotateCw, Send, Siren, X } from 'lucide-react';
import type { AlertChannel } from '../types/alertTypes';
import { ALERT_SEVERITY_CSS, ALERT_SEVERITY_LABEL } from '../utils/coastalAlert';
import type { AlertPhase } from './alertSendState';
import {
  DRILL_BANNER,
  EM_DASH,
  buildAlertSubject,
  maskEmail,
  rowValue,
  type AlertDetails,
} from './alertDetails';

interface AlertPreviewModalProps {
  details: AlertDetails;
  /** Forecast / attribution still in flight — sending waits so the email never goes out half-filled. */
  isLoading: boolean;
  phase: AlertPhase;
  error: string | null;
  channel: AlertChannel;
  /** Demo inbox the alert goes to; empty when VITE_EMAILJS_TO_EMAIL is unset. */
  recipient: string;
  onSend: () => void;
  onSendAgain: () => void;
  onClose: () => void;
}

/** Fullscreen mode only paints the fullscreen element's subtree, so portal there rather than to <body>. */
function portalTarget(): HTMLElement {
  return (document.fullscreenElement as HTMLElement | null) ?? document.body;
}

const CAPTION = 'text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground';
const QUALIFICATION_CLAMP_CHARS = 150;

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <p className={CAPTION}>{label}</p>
      <div className="mt-1.5 font-mono text-[19px] font-semibold leading-none tracking-tight text-foreground">
        {children}
      </div>
    </div>
  );
}

const Tag = ({ tone, children }: { tone: 'info' | 'warn'; children: ReactNode }) => (
  <span
    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
      tone === 'warn' ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300' : 'bg-primary/10 text-primary'
    }`}
  >
    {children}
  </span>
);

export function AlertPreviewModal({
  details,
  isLoading,
  phase,
  error,
  channel,
  recipient,
  onSend,
  onSendAgain,
  onClose,
}: AlertPreviewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [qualificationOpen, setQualificationOpen] = useState(false);
  const noStation = details.stationId === null;
  const sending = phase === 'sending';

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const disabled = isLoading || noStation || sending || phase === 'sent';
  const value = (label: string) => rowValue(details, label);
  /** A forecast/attribution field still pending shows a loading mark rather than a premature "—". */
  const asyncValue = (label: string) => {
    const v = value(label);
    return isLoading && v === EM_DASH ? <span className="font-sans text-xs font-medium text-muted-foreground">Loading…</span> : v;
  };

  const severity = details.severity;
  const severityColor = severity ? ALERT_SEVERITY_CSS[severity] : null;
  const stationName = value('Nearest station');
  const hasStation = stationName !== EM_DASH;
  const qualification = value('Attribution qualification');
  const longQualification = qualification.length > QUALIFICATION_CLAMP_CHARS;
  const detected = value('Detected');

  const sendLabel = sending
    ? 'Sending…'
    : phase === 'sent'
      ? channel === 'mailto'
        ? 'Draft opened'
        : 'Sent'
      : phase === 'failed'
        ? 'Retry'
        : isLoading
          ? 'Loading…'
          : 'Send alert';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-preview-title"
        tabIndex={-1}
        className="flex max-h-[94vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl outline-none"
      >
        {/* Header — tinted by the coastal severity, so the alert's urgency is the first thing read */}
        <header
          className="border-b border-border"
          style={severityColor ? { background: `color-mix(in srgb, ${severityColor} 13%, transparent)` } : undefined}
        >
          <div className="flex items-start gap-3 px-5 pb-3.5 pt-4">
            <span
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground"
              style={{
                background: severityColor ? `color-mix(in srgb, ${severityColor} 24%, transparent)` : 'var(--muted)',
                color: severityColor ?? 'var(--muted-foreground)',
              }}
              aria-hidden
            >
              <Siren size={20} strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className={CAPTION}>Coastal drill alert</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em]">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: severityColor ?? 'var(--muted-foreground)' }}
                    aria-hidden
                  />
                  {severity ? ALERT_SEVERITY_LABEL[severity] : asyncValue('Coastal severity')}
                </span>
              </div>
              <h2 id="alert-preview-title" className="mt-1 truncate text-[19px] font-semibold leading-tight tracking-tight">
                Oil spill <span className="font-mono text-[17px]">{details.spillId}</span>
              </h2>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                Detected {detected}
                {detected !== EM_DASH && ' UTC'} · <span className="font-mono">{value('Position')}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drill stamp — same wording as the email */}
          <div
            className="flex items-center gap-2.5 bg-amber-700 px-5 py-2 text-white"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(0,0,0,0.14) 0 10px, transparent 10px 20px)',
            }}
          >
            <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-extrabold tracking-[0.14em] text-amber-800">
              DRILL
            </span>
            <span className="text-[12.5px] font-semibold">{DRILL_BANNER.replace(/^DRILL — /, '')}</span>
          </div>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {/* Recipient */}
          <section aria-label="Recipient station">
            <p className={CAPTION}>Notifying</p>
            <div className="mt-2 flex items-start gap-3 rounded-xl border border-border p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden>
                <Anchor size={19} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug">{hasStation ? stationName : EM_DASH}</p>
                {details.stationLocalName && (
                  <p lang="el" className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                    {details.stationLocalName}
                  </p>
                )}
                <p className="mt-1 text-[12.5px] text-muted-foreground">{value('Organisation')}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[20px] font-semibold leading-none tracking-tight">{value('Straight-line distance')}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">straight line</p>
              </div>
            </div>
          </section>

          {/* Key figures */}
          <div className="grid grid-cols-3 gap-2.5">
            <Metric label="Coastal ETA">
              {value('Coastal ETA').startsWith('No landfall') ? (
                <span className="font-sans text-[13px] font-medium leading-snug">No landfall ETA</span>
              ) : (
                asyncValue('Coastal ETA')
              )}
            </Metric>
            <Metric label="Slick area">{value('Area')}</Metric>
            <Metric label="Detection">{value('Detection confidence')}</Metric>
          </div>

          {/* Attribution */}
          <section aria-label="Vessel attribution" className="rounded-lg border border-border">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className={CAPTION}>Top candidate vessel</span>
              {details.vessel ? (
                <span className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                  <span className="truncate font-mono text-xs font-medium">{details.vessel.name}</span>
                  {details.vessel.matchScore && <Tag tone="info">{details.vessel.matchScore} match</Tag>}
                  {details.vessel.synthetic && <Tag tone="warn">Synthetic ID</Tag>}
                </span>
              ) : (
                <span className="text-[13px]">{asyncValue('Top candidate vessel')}</span>
              )}
            </div>
            <div className="border-t border-border bg-muted/40 px-3 py-2.5">
              <p className={CAPTION}>Attribution qualification</p>
              <p
                className={`mt-1.5 text-[13px] leading-relaxed text-foreground/90 ${
                  longQualification && !qualificationOpen ? 'line-clamp-2' : ''
                }`}
              >
                {qualification === EM_DASH ? asyncValue('Attribution qualification') : qualification}
              </p>
              {longQualification && (
                <button
                  type="button"
                  onClick={() => setQualificationOpen((open) => !open)}
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  {qualificationOpen ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </section>

          {noStation && (
            <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-900 dark:text-amber-200">
              No coast guard station is available for this spill, so there is nobody to alert.
            </p>
          )}
          {phase === 'failed' && error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-800 dark:text-red-300"
            >
              Could not send: {error}
            </p>
          )}
        </div>

        {/* Footer — how it will be delivered, then the actions */}
        <footer className="space-y-3 border-t border-border bg-muted/30 px-5 pb-4 pt-3.5">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted-foreground">To</dt>
            <dd className="min-w-0">
              <span className="font-semibold">{recipient ? maskEmail(recipient) : EM_DASH}</span>{' '}
              <span className="text-muted-foreground">
                · demo inbox, {channel === 'emailjs' ? 'via EmailJS' : 'opens your mail client (EmailJS not configured)'}
              </span>
            </dd>
            <dt className="text-muted-foreground">Subject</dt>
            <dd className="min-w-0 truncate font-mono text-[11.5px]">{buildAlertSubject(details)}</dd>
          </dl>
          <p className="text-[11.5px] leading-snug text-muted-foreground">
            This drill is never sent to the station. Distance is straight-line, not a sailing distance.
          </p>
          <div className="flex items-center justify-between gap-2">
            {phase === 'sent' ? (
              <button
                type="button"
                onClick={onSendAgain}
                className="text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Send again
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-[10px] border border-border bg-card px-[18px] text-sm font-medium transition-colors hover:bg-accent"
              >
                {phase === 'sent' ? 'Close' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={onSend}
                disabled={disabled}
                aria-busy={sending}
                className={`inline-flex h-11 items-center gap-2 rounded-[10px] border px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  phase === 'sent'
                    ? 'border-green-600/50 bg-green-600/10 text-green-800 dark:text-green-300'
                    : phase === 'failed'
                      ? 'border-red-500/60 bg-red-500/10 text-red-800 dark:text-red-300'
                      : 'border-primary bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : phase === 'sent' ? (
                  <Check size={16} />
                ) : phase === 'failed' ? (
                  <RotateCw size={16} />
                ) : (
                  <Send size={16} />
                )}
                {sendLabel}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>,
    portalTarget()
  );
}
