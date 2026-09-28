import { createKeyedLock } from '@utils/keyed-lock';
import { describe, expect, it } from 'vitest';

/** A piece of work that records when it starts and ends, and takes a while in between. */
const recorder = (events: string[]) => (name: string, delayMs: number) => async (): Promise<string> => {
  events.push(`${name} start`);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  events.push(`${name} end`);
  return name;
};

describe('createKeyedLock', () => {
  it('runs work for the same key one at a time, in the order it arrived', async () => {
    const events: string[] = [];
    const work = recorder(events);
    const runExclusively = createKeyedLock();

    const results = await Promise.all([runExclusively('errand-1', work('first', 20)), runExclusively('errand-1', work('second', 1))]);

    expect(results).toEqual(['first', 'second']);
    expect(events).toEqual(['first start', 'first end', 'second start', 'second end']);
  });

  it('runs work for different keys side by side', async () => {
    const events: string[] = [];
    const work = recorder(events);
    const runExclusively = createKeyedLock();

    await Promise.all([runExclusively('errand-1', work('first', 20)), runExclusively('errand-2', work('second', 1))]);

    expect(events.indexOf('second start')).toBeLessThan(events.indexOf('first end'));
  });

  it('lets the next work run after a failure, and passes the failure to its own caller only', async () => {
    const runExclusively = createKeyedLock();

    const failing = runExclusively('errand-1', () => Promise.reject(new Error('careM svarade inte')));
    const next = runExclusively('errand-1', () => Promise.resolve('ran'));

    await expect(failing).rejects.toThrow('careM svarade inte');
    await expect(next).resolves.toBe('ran');
  });
});
