import type { AlertLogEntry, CoastGuardStation } from '../types/alertTypes';
import { formatUtcTimestamp } from '../utils/formatSpill';
import { ModuleCard } from '../controls/sidebarModules';

const MAX_ROWS = 50;

const CHANNEL_LABEL: Record<AlertLogEntry['channel'], string> = {
  emailjs: 'via EmailJS',
  // A mailto link only opens a draft; the log can't know it was actually sent from there.
  mailto: 'via mail client',
};

function formatSentAt(iso: string): string {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? `${formatUtcTimestamp(ms)} UTC` : '—';
}

/** Every drill alert raised from this browser, newest first. */
export function AlertLogModule({
  log,
  stations,
}: {
  log: readonly AlertLogEntry[];
  stations: readonly CoastGuardStation[];
}) {
  const stationName = (id: string) => stations.find((s) => s.id === id)?.name || id;
  const rows = [...log].reverse().slice(0, MAX_ROWS);

  return (
    <ModuleCard title={`Alerts from this browser · ${log.length}`}>
      {rows.length === 0 && (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          No alerts yet. Use “Send drill alert” in the Investigation panel.
        </p>
      )}
      <ul className="-mx-0.5 divide-y divide-border">
        {rows.map((entry, index) => (
          <li
            key={`${entry.sent_at}-${entry.spill_id}-${index}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-0.5 py-2.5 first:pt-0"
          >
            <span className="truncate font-mono text-[12.5px] font-semibold">{entry.spill_id}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                entry.status === 'Sent'
                  ? 'bg-green-600/10 text-green-800 dark:text-green-300'
                  : 'bg-red-500/10 text-red-800 dark:text-red-300'
              }`}
            >
              {entry.status}
            </span>
            <span className="truncate text-[11.5px] text-muted-foreground" title={stationName(entry.station_id)}>
              {stationName(entry.station_id)}
            </span>
            <span className="text-right text-[11px] text-muted-foreground">{CHANNEL_LABEL[entry.channel]}</span>
            <span className="col-span-2 font-mono text-[11px] text-muted-foreground">{formatSentAt(entry.sent_at)}</span>
          </li>
        ))}
      </ul>
      {log.length > MAX_ROWS && (
        <p className="text-[10px] text-muted-foreground">Showing the latest {MAX_ROWS}.</p>
      )}
      <p className="border-t border-border pt-2 text-[10.5px] leading-relaxed text-muted-foreground">
        “Sent” means the request was accepted. The log does not track whether anyone read or acted on it.
      </p>
    </ModuleCard>
  );
}
