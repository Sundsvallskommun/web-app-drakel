import { caremanagementError } from '@utils/caremanagement-error';
import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

const upstreamError = (status: number, data?: unknown): AxiosError => {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('upstream failed', 'ERR_BAD_RESPONSE', config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  });
};

describe('caremanagementError', () => {
  it('carries a 502 through with the reason the upstream system gave', () => {
    // The sentence names which of the handläggare's data Lifecare could not work with, so it is the
    // whole value of the failure — a generic message would leave them nothing to act on.
    const mapped = caremanagementError(
      upstreamError(502, { detail: 'No personal identity number could be resolved for a person on the calculation' }),
    );

    expect(mapped.status).toBe(502);
    expect(mapped.message).toBe('No personal identity number could be resolved for a person on the calculation');
  });

  it('still reports a 502 that came without a reason', () => {
    const mapped = caremanagementError(upstreamError(502, {}));

    expect(mapped.status).toBe(502);
    expect(mapped.message).not.toBe('');
  });

  it('carries a 409 through with the reason caremanagement gave', () => {
    // A finalize conflict can be the wrong status, unapproved sections or a second finalize — the detail
    // is what tells the handläggare which.
    const mapped = caremanagementError(upstreamError(409, { detail: 'The errand has already been finalized' }));

    expect(mapped.status).toBe(409);
    expect(mapped.message).toBe('The errand has already been finalized');
  });

  it('maps the statuses that mean something to the client', () => {
    expect(caremanagementError(upstreamError(404)).status).toBe(404);
    expect(caremanagementError(upstreamError(413)).status).toBe(413);
    expect(caremanagementError(upstreamError(400)).status).toBe(400);
  });

  it('collapses anything else to a 500', () => {
    expect(caremanagementError(upstreamError(418)).status).toBe(500);
    expect(caremanagementError(new Error('socket hang up')).status).toBe(500);
  });
});
