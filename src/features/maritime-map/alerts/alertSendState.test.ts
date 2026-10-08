import { describe, expect, it } from 'vitest';
import {
  IDLE_ALERT_STATE,
  alertSendReducer,
  alertStateFor,
  type AlertSendAction,
  type AlertSendState,
} from './alertSendState';

const run = (actions: AlertSendAction[], from: AlertSendState = IDLE_ALERT_STATE) =>
  actions.reduce(alertSendReducer, from);

describe('alertSendReducer', () => {
  it('walks idle → sending → sent', () => {
    expect(run([{ type: 'start', spillId: 'a' }]).phase).toBe('sending');
    expect(run([{ type: 'start', spillId: 'a' }, { type: 'success', spillId: 'a' }]).phase).toBe('sent');
  });

  it('ignores a second start while sending (no double-send)', () => {
    const sending = run([{ type: 'start', spillId: 'a' }]);
    expect(alertSendReducer(sending, { type: 'start', spillId: 'a' })).toBe(sending);
    expect(alertSendReducer(sending, { type: 'reset', spillId: 'a' })).toBe(sending);
  });

  it('records the error on failure and allows a retry', () => {
    const failed = run([
      { type: 'start', spillId: 'a' },
      { type: 'failure', spillId: 'a', error: 'boom' },
    ]);
    expect(failed).toMatchObject({ phase: 'failed', error: 'boom' });
    expect(alertSendReducer(failed, { type: 'start', spillId: 'a' })).toMatchObject({
      phase: 'sending',
      error: null,
    });
  });

  it('keeps "sent" until deliberately reset', () => {
    const sent = run([{ type: 'start', spillId: 'a' }, { type: 'success', spillId: 'a' }]);
    expect(alertSendReducer(sent, { type: 'start', spillId: 'a' })).toBe(sent);
    expect(alertSendReducer(sent, { type: 'reset', spillId: 'a' }).phase).toBe('idle');
  });

  it('ignores results that arrive without a send in flight', () => {
    expect(run([{ type: 'success', spillId: 'a' }]).phase).toBe('idle');
    expect(run([{ type: 'failure', spillId: 'a', error: 'x' }]).phase).toBe('idle');
  });

  it('scopes state to a spill: another selection reads as idle', () => {
    const sent = run([{ type: 'start', spillId: 'a' }, { type: 'success', spillId: 'a' }]);
    expect(alertStateFor(sent, 'a').phase).toBe('sent');
    expect(alertStateFor(sent, 'b').phase).toBe('idle');
    expect(alertStateFor(sent, null).phase).toBe('idle');
    // A late result for the old spill must not bleed into the new one.
    expect(alertStateFor(alertSendReducer(sent, { type: 'start', spillId: 'b' }), 'a').phase).toBe('idle');
  });
});
