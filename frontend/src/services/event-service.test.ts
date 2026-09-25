import { apiService } from '@services/api-service';
import { AxiosHeaders, AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getActorEvents } from './event-service';

vi.mock('@services/api-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@services/api-service')>()),
  apiService: { get: vi.fn() },
}));

/** The BFF's answer when nothing matches the search. */
const NO_EVENTS: AxiosResponse = {
  data: { data: { events: [], total: 0 }, message: 'success' },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: new AxiosHeaders() },
};

describe('getActorEvents', () => {
  beforeEach(() => {
    vi.mocked(apiService.get).mockResolvedValue(NO_EVENTS);
  });

  it("asks the BFF for the handläggare's activity, with only the filters given", async () => {
    const result = await getActorEvents({ actor: 'abc01def', action: 'READ', from: '2026-09-01T00:00:00' });

    expect(apiService.get).toHaveBeenCalledWith(
      'admin/actor-activity?actor=abc01def&action=READ&from=2026-09-01T00%3A00%3A00'
    );
    expect(result).toEqual({ data: { events: [], total: 0 } });
  });

  it('keeps "event-log" out of the address, which ad blockers block (EasyPrivacy\'s /event-log?)', async () => {
    await getActorEvents({ actor: 'abc01def' });

    expect(vi.mocked(apiService.get).mock.calls[0]?.[0]).not.toMatch(/event-log/);
  });
});
