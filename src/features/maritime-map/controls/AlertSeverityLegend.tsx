import { ALERT_SEVERITY_CSS, ALERT_SEVERITY_LABEL, type AlertSeverity } from '../utils/coastalAlert';

const SEVERITIES: AlertSeverity[] = ['monitor', 'advisory', 'watch', 'critical'];

/**
 * Color key for the predicted-position marker (see `MaritimeMap.tsx`) and
 * `InvestigationPanel.tsx`'s coastal-alert banner, which both now read
 * severity off the same `ALERT_SEVERITY_CSS` scale instead of a fixed
 * colour — without this, a viewer has no way to know what a red vs. amber
 * marker means without opening the panel and reading the banner text.
 */
export function AlertSeverityLegend() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground shadow-md backdrop-blur-md">
      {SEVERITIES.map((severity) => (
        <span key={severity} className="flex items-center gap-1.5 whitespace-nowrap">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: ALERT_SEVERITY_CSS[severity] }}
          />
          {ALERT_SEVERITY_LABEL[severity]}
        </span>
      ))}
    </div>
  );
}
