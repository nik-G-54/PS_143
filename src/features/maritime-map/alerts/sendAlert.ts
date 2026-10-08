// Delivery of a drill alert. The recipient is always the demo inbox from
// VITE_EMAILJS_TO_EMAIL — never an address belonging to the station.

import type { AlertChannel, AlertLogEntry } from '../types/alertTypes';
import { buildEmailParams, buildMailtoUrl, type AlertDetails } from './alertDetails';

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  recipient: string;
}

export interface AlertEnv {
  VITE_EMAILJS_SERVICE_ID?: string;
  VITE_EMAILJS_TEMPLATE_ID?: string;
  VITE_EMAILJS_PUBLIC_KEY?: string;
  /** The demo inbox. */
  VITE_EMAILJS_TO_EMAIL?: string;
  /** Older name for `VITE_EMAILJS_TO_EMAIL`, still honoured when that one is unset. */
  VITE_EMAILJS_RECIPIENT?: string;
}

/** Vite inlines the VITE_* values at build time; the cast only narrows the type to the keys read here. */
export const ALERT_ENV = import.meta.env as AlertEnv;

const clean = (value: string | undefined): string => (value ?? '').trim();

/** Deliberately loose — catches a pasted placeholder or typo, not every RFC corner case. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Raw recipient value, whichever of the two accepted names holds it. */
function recipientValue(env: AlertEnv): string {
  return clean(env.VITE_EMAILJS_TO_EMAIL) || clean(env.VITE_EMAILJS_RECIPIENT);
}

/**
 * Recipient even when EmailJS itself isn't configured, so the mailto fallback
 * can still address the demo inbox. Empty when unset or not shaped like an address.
 */
export function readRecipient(env: AlertEnv): string {
  const value = recipientValue(env);
  return EMAIL_SHAPE.test(value) ? value : '';
}

export interface EmailJsConfigCheck {
  config: EmailJsConfig | null;
  /** Names of env keys that are unset or empty. Never values. */
  missing: string[];
  /** Names of env keys that are set but unusable (recipient not shaped like an email). Never values. */
  invalid: string[];
}

/** Same rules as `readEmailJsConfig`, but says which keys are the problem. */
export function checkEmailJsConfig(env: AlertEnv): EmailJsConfigCheck {
  const serviceId = clean(env.VITE_EMAILJS_SERVICE_ID);
  const templateId = clean(env.VITE_EMAILJS_TEMPLATE_ID);
  const publicKey = clean(env.VITE_EMAILJS_PUBLIC_KEY);
  const rawRecipient = recipientValue(env);
  const recipient = readRecipient(env);

  const missing: string[] = [];
  const invalid: string[] = [];
  if (!serviceId) missing.push('VITE_EMAILJS_SERVICE_ID');
  if (!templateId) missing.push('VITE_EMAILJS_TEMPLATE_ID');
  if (!publicKey) missing.push('VITE_EMAILJS_PUBLIC_KEY');
  if (!rawRecipient) missing.push('VITE_EMAILJS_TO_EMAIL');
  else if (!recipient) invalid.push('VITE_EMAILJS_TO_EMAIL');

  const ok = missing.length === 0 && invalid.length === 0;
  return { config: ok ? { serviceId, templateId, publicKey, recipient } : null, missing, invalid };
}

/** Null unless every EmailJS value is present and usable — otherwise the alert falls back to mailto. */
export function readEmailJsConfig(env: AlertEnv): EmailJsConfig | null {
  return checkEmailJsConfig(env).config;
}

/** One-line, values-free explanation of why EmailJS is off; null when it is on. */
export function describeConfigProblem(check: EmailJsConfigCheck): string | null {
  if (check.config) return null;
  const parts: string[] = [];
  if (check.missing.length) parts.push(`missing ${check.missing.join(', ')}`);
  if (check.invalid.length) parts.push(`invalid (not an email address) ${check.invalid.join(', ')}`);
  return `EmailJS is not configured - ${parts.join('; ')}. Falling back to mailto. Restart the dev server after editing .env.`;
}

const warned = new Set<string>();

/**
 * Dev-only breadcrumb so a misnamed or missing env key never fails silently.
 * Logs key names only, once per distinct problem. `dev` and `warn` are
 * injectable for tests.
 */
export function warnIfEmailJsUnconfigured(
  env: AlertEnv,
  dev: boolean = import.meta.env.DEV,
  warn: (message: string) => void = (message) => console.warn(`[alerts] ${message}`)
): void {
  if (!dev) return;
  const problem = describeConfigProblem(checkEmailJsConfig(env));
  if (!problem || warned.has(problem)) return;
  warned.add(problem);
  warn(problem);
}

export function resolveChannel(env: AlertEnv): AlertChannel {
  warnIfEmailJsUnconfigured(env);
  return readEmailJsConfig(env) ? 'emailjs' : 'mailto';
}

export interface SendDeps {
  sendEmail: (
    serviceId: string,
    templateId: string,
    params: Record<string, string>,
    options: { publicKey: string }
  ) => Promise<unknown>;
  openMailto: (url: string) => void;
  now?: () => Date;
}

export interface SendOutcome {
  entry: AlertLogEntry;
  /** Human-readable reason when `entry.status` is "Failed". */
  error: string | null;
}

function describeError(cause: unknown): string {
  // EmailJS rejects with { status, text } rather than an Error.
  if (cause && typeof cause === 'object') {
    const { text, message } = cause as { text?: unknown; message?: unknown };
    if (typeof text === 'string' && text) return text;
    if (typeof message === 'string' && message) return message;
  }
  return typeof cause === 'string' && cause ? cause : 'Unknown error';
}

/**
 * Sends (or, without EmailJS config, opens a mailto draft for) one alert.
 * "Sent" means only that EmailJS accepted the request, or — for mailto — that
 * the mail client was opened; neither says anything about the station
 * receiving or acting on it, so no further status exists.
 */
export async function dispatchAlert(
  details: AlertDetails,
  stationId: string,
  env: AlertEnv,
  deps: SendDeps
): Promise<SendOutcome> {
  const config = readEmailJsConfig(env);
  const channel: AlertChannel = config ? 'emailjs' : 'mailto';
  const sentAt = (deps.now?.() ?? new Date()).toISOString();
  const entryFor = (status: 'Sent' | 'Failed'): AlertLogEntry => ({
    spill_id: details.spillId,
    station_id: stationId,
    sent_at: sentAt,
    channel,
    status,
  });

  try {
    if (config) {
      await deps.sendEmail(
        config.serviceId,
        config.templateId,
        buildEmailParams(details, config.recipient),
        { publicKey: config.publicKey }
      );
    } else {
      deps.openMailto(buildMailtoUrl(details, readRecipient(env)));
    }
    return { entry: entryFor('Sent'), error: null };
  } catch (cause) {
    return { entry: entryFor('Failed'), error: describeError(cause) };
  }
}

/** Real dependencies; the EmailJS SDK loads on first send so it never weighs on the map's initial bundle. */
export const browserSendDeps: SendDeps = {
  sendEmail: async (serviceId, templateId, params, options) => {
    const { default: emailjs } = await import('@emailjs/browser');
    return emailjs.send(serviceId, templateId, params, options);
  },
  openMailto: (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.click();
  },
};
