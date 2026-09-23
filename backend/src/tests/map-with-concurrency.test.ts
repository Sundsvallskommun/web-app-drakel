import { mapWithConcurrency } from '@utils/map-with-concurrency';
import { describe, expect, it } from 'vitest';

describe('mapWithConcurrency', () => {
  it('keeps the input order whatever order the calls finish in', async () => {
    const delays = [30, 5, 15, 1];

    const results = await mapWithConcurrency(
      delays,
      2,
      delay =>
        new Promise<number>(resolve =>
          setTimeout(() => {
            resolve(delay);
          }, delay),
        ),
    );

    expect(results).toEqual([30, 5, 15, 1]);
  });

  it('never has more calls in flight than the limit', async () => {
    let inFlight = 0;
    let mostInFlight = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5, 6], 3, async () => {
      inFlight += 1;
      mostInFlight = Math.max(mostInFlight, inFlight);
      await new Promise(resolve => setTimeout(resolve, 5));
      inFlight -= 1;
    });

    expect(mostInFlight).toBe(3);
  });

  it('returns nothing for nothing', async () => {
    expect(await mapWithConcurrency([], 4, () => Promise.resolve(1))).toEqual([]);
  });
});
