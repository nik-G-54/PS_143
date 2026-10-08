import { describe, expect, it } from 'vitest';
import type { AlertLogEntry } from '../types/alertTypes';
import { ALERT_LOG_KEY, alertedSpillIds, appendAlertLog, readAlertLog } from './alertLog';

function memoryStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(ALERT_LOG_KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const entry = (overrides: Partial<AlertLogEntry> = {}): AlertLogEntry => ({
  spill_id: 'spill_1',
  station_id: 'S1',
  sent_at: '2024-05-01T12:00:00.000Z',
  channel: 'emailjs',
  status: 'Sent',
  ...overrides,
});

describe('alert log', () => {
  it('appends entries in order and reads them back', () => {
    const storage = memoryStorage();
    expect(appendAlertLog(entry(), storage)).toBe(true);
    expect(appendAlertLog(entry({ spill_id: 'spill_2', status: 'Failed' }), storage)).toBe(true);
    expect(readAlertLog(storage).map((e) => [e.spill_id, e.status])).toEqual([
      ['spill_1', 'Sent'],
      ['spill_2', 'Failed'],
    ]);
  });

  it('survives corrupt stored data and drops malformed entries', () => {
    expect(readAlertLog(memoryStorage('{not json'))).toEqual([]);
    expect(readAlertLog(memoryStorage('{"a":1}'))).toEqual([]);
    const mixed = JSON.stringify([entry(), { spill_id: 'x' }, entry({ status: 'Acknowledged' as never })]);
    expect(readAlertLog(memoryStorage(mixed))).toEqual([entry()]);
  });

  it('never throws when storage is blocked or full', () => {
    const throwing = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(readAlertLog(throwing)).toEqual([]);
    expect(appendAlertLog(entry(), throwing)).toBe(false);
    expect(appendAlertLog(entry(), null)).toBe(false);
  });

  it('counts only successful alerts as "alerted"', () => {
    const ids = alertedSpillIds([
      entry({ spill_id: 'a', status: 'Sent' }),
      entry({ spill_id: 'b', status: 'Failed' }),
    ]);
    expect([...ids]).toEqual(['a']);
  });
});
