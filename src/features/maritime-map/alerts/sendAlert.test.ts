import { describe, expect, it, vi } from 'vitest';
import type { AlertDetails } from './alertDetails';
import {
  checkEmailJsConfig,
  describeConfigProblem,
  dispatchAlert,
  readEmailJsConfig,
  readRecipient,
  resolveChannel,
  warnIfEmailJsUnconfigured,
  type AlertEnv,
  type SendDeps,
} from './sendAlert';

const details: AlertDetails = {
  spillId: 'spill_1',
  stationId: 'S1',
  severity: null,
  vessel: null,
  rows: [{ label: 'Spill ID', value: 'spill_1' }],
};

const FULL_ENV: AlertEnv = {
  VITE_EMAILJS_SERVICE_ID: 'svc',
  VITE_EMAILJS_TEMPLATE_ID: 'tpl',
  VITE_EMAILJS_PUBLIC_KEY: 'pub',
  VITE_EMAILJS_TO_EMAIL: 'demo@example.test',
};

const NOW = new Date('2024-05-01T12:00:00Z');

function deps(overrides: Partial<SendDeps> = {}): SendDeps {
  return {
    sendEmail: vi.fn().mockResolvedValue({ status: 200, text: 'OK' }),
    openMailto: vi.fn(),
    now: () => NOW,
    ...overrides,
  };
}

describe('readEmailJsConfig', () => {
  it('needs all four values', () => {
    expect(readEmailJsConfig(FULL_ENV)).not.toBeNull();
    for (const key of Object.keys(FULL_ENV) as (keyof AlertEnv)[]) {
      expect(readEmailJsConfig({ ...FULL_ENV, [key]: '  ' }), key).toBeNull();
      expect(readEmailJsConfig({ ...FULL_ENV, [key]: undefined }), key).toBeNull();
    }
  });

  it('picks the channel from the env', () => {
    expect(resolveChannel(FULL_ENV)).toBe('emailjs');
    expect(resolveChannel({})).toBe('mailto');
  });
});

describe('checkEmailJsConfig', () => {
  // Shaped like real values, none of them real.
  const REALISTIC: AlertEnv = {
    VITE_EMAILJS_SERVICE_ID: 'service_a1b2c3d',
    VITE_EMAILJS_TEMPLATE_ID: 'template_x9y8z7w',
    VITE_EMAILJS_PUBLIC_KEY: 'Pcc4AbCdEfGhIjKlM',
    VITE_EMAILJS_TO_EMAIL: 'someone.name@gmail.com',
  };

  it('returns a full config for realistic values', () => {
    expect(checkEmailJsConfig(REALISTIC)).toEqual({
      config: {
        serviceId: 'service_a1b2c3d',
        templateId: 'template_x9y8z7w',
        publicKey: 'Pcc4AbCdEfGhIjKlM',
        recipient: 'someone.name@gmail.com',
      },
      missing: [],
      invalid: [],
    });
    expect(describeConfigProblem(checkEmailJsConfig(REALISTIC))).toBeNull();
  });

  it('names the missing key, and only the key', () => {
    const check = checkEmailJsConfig({ ...REALISTIC, VITE_EMAILJS_PUBLIC_KEY: undefined });
    expect(check.config).toBeNull();
    expect(check.missing).toEqual(['VITE_EMAILJS_PUBLIC_KEY']);
    const message = describeConfigProblem(check) ?? '';
    expect(message).toContain('VITE_EMAILJS_PUBLIC_KEY');
    expect(message).not.toContain('Pcc4');
    expect(message).not.toContain('gmail.com');
  });

  it('reproduces the reported bug: all keys set but the recipient under an unknown name', () => {
    const { VITE_EMAILJS_TO_EMAIL: _unused, ...rest } = REALISTIC;
    const wrongName = { ...rest, VITE_EMAILJS_TO: 'someone.name@gmail.com' } as AlertEnv;
    const check = checkEmailJsConfig(wrongName);
    expect(check.config).toBeNull();
    expect(check.missing).toEqual(['VITE_EMAILJS_TO_EMAIL']);
  });

  it('still honours the older VITE_EMAILJS_RECIPIENT name, with TO_EMAIL taking priority', () => {
    const { VITE_EMAILJS_TO_EMAIL: _unused, ...rest } = REALISTIC;
    expect(readRecipient({ ...rest, VITE_EMAILJS_RECIPIENT: 'old@example.test' })).toBe('old@example.test');
    expect(readRecipient({ ...REALISTIC, VITE_EMAILJS_RECIPIENT: 'old@example.test' })).toBe(
      'someone.name@gmail.com'
    );
  });

  it('flags a recipient that is not shaped like an email as invalid, not missing', () => {
    const check = checkEmailJsConfig({ ...REALISTIC, VITE_EMAILJS_TO_EMAIL: 'your_email_here' });
    expect(check.config).toBeNull();
    expect(check.invalid).toEqual(['VITE_EMAILJS_TO_EMAIL']);
    expect(check.missing).toEqual([]);
    expect(readRecipient({ VITE_EMAILJS_TO_EMAIL: 'a@b' })).toBe('');
  });

  it('does not reject real-world ids and keys (no placeholder or length heuristics)', () => {
    expect(
      readEmailJsConfig({ ...REALISTIC, VITE_EMAILJS_SERVICE_ID: 'x', VITE_EMAILJS_PUBLIC_KEY: 'k'.repeat(40) })
    ).not.toBeNull();
  });
});

describe('warnIfEmailJsUnconfigured', () => {
  it('warns once in dev with key names only', () => {
    const warn = vi.fn();
    const env: AlertEnv = { VITE_EMAILJS_SERVICE_ID: 'service_secretvalue', VITE_EMAILJS_TO_EMAIL: 'x@y.test' };
    warnIfEmailJsUnconfigured(env, true, warn);
    warnIfEmailJsUnconfigured(env, true, warn);
    expect(warn).toHaveBeenCalledTimes(1);
    const message = warn.mock.calls[0][0] as string;
    expect(message).toContain('VITE_EMAILJS_TEMPLATE_ID');
    expect(message).toContain('VITE_EMAILJS_PUBLIC_KEY');
    expect(message).not.toContain('secretvalue');
    expect(message).not.toContain('x@y.test');
  });

  it('is silent outside dev and when fully configured', () => {
    const warn = vi.fn();
    warnIfEmailJsUnconfigured({}, false, warn);
    warnIfEmailJsUnconfigured(FULL_ENV, true, warn);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('dispatchAlert', () => {
  it('sends through EmailJS to the demo inbox and logs Sent', async () => {
    const d = deps();
    const { entry, error } = await dispatchAlert(details, 'S1', FULL_ENV, d);

    expect(error).toBeNull();
    expect(entry).toEqual({
      spill_id: 'spill_1',
      station_id: 'S1',
      sent_at: NOW.toISOString(),
      channel: 'emailjs',
      status: 'Sent',
    });
    expect(d.sendEmail).toHaveBeenCalledTimes(1);
    const [service, template, params, options] = (d.sendEmail as ReturnType<typeof vi.fn>).mock.calls[0];
    expect([service, template, options]).toEqual(['svc', 'tpl', { publicKey: 'pub' }]);
    expect(params.to_email).toBe('demo@example.test');
    expect(d.openMailto).not.toHaveBeenCalled();
  });

  it('logs Failed with the reason when EmailJS rejects, and succeeds on retry', async () => {
    const sendEmail = vi
      .fn()
      .mockRejectedValueOnce({ status: 400, text: 'The Public Key is invalid' })
      .mockResolvedValueOnce({ status: 200, text: 'OK' });
    const d = deps({ sendEmail });

    const first = await dispatchAlert(details, 'S1', FULL_ENV, d);
    expect(first.entry.status).toBe('Failed');
    expect(first.entry.channel).toBe('emailjs');
    expect(first.error).toBe('The Public Key is invalid');

    const retry = await dispatchAlert(details, 'S1', FULL_ENV, d);
    expect(retry.entry.status).toBe('Sent');
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it('falls back to mailto when env vars are missing, without calling EmailJS', async () => {
    const d = deps();
    const { entry } = await dispatchAlert(details, 'S1', { VITE_EMAILJS_TO_EMAIL: 'demo@example.test' }, d);

    expect(entry.channel).toBe('mailto');
    expect(entry.status).toBe('Sent');
    expect(d.sendEmail).not.toHaveBeenCalled();
    expect(d.openMailto).toHaveBeenCalledTimes(1);
    expect((d.openMailto as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatch(/^mailto:demo%40example\.test\?/);
  });

  it('logs Failed when the mail client cannot be opened', async () => {
    const d = deps({
      openMailto: () => {
        throw new Error('blocked');
      },
    });
    const { entry, error } = await dispatchAlert(details, 'S1', {}, d);
    expect(entry.status).toBe('Failed');
    expect(entry.channel).toBe('mailto');
    expect(error).toBe('blocked');
  });
});
