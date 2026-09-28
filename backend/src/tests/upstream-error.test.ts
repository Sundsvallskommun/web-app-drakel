import { logger } from '@utils/logger';
import { upstreamErrorMapper } from '@utils/upstream-error';
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

const templatingError = upstreamErrorMapper('Templating');

const upstreamError = (status: number, data?: unknown): AxiosError => {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('upstream failed', 'ERR_BAD_RESPONSE', config, undefined, { status, statusText: '', headers: {}, config, data });
};

describe('upstreamErrorMapper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names the upstream it maps for in the messages drakel writes itself', () => {
    expect(templatingError(upstreamError(400)).message).toBe('Bad request from Templating');
    expect(templatingError(upstreamError(503)).message).toBe('A system behind Templating is not available');
    expect(templatingError(new Error('socket hang up')).message).toBe('Internal server error from Templating');
  });

  it('answers a call that ran out of time with a 504', () => {
    const timedOut = new AxiosError('timeout of 30000ms exceeded', 'ECONNABORTED');

    expect(templatingError(timedOut).status).toBe(504);
  });

  it('logs a failure it cannot pass on by status and code only — never the body or the message', () => {
    const error = vi.spyOn(logger, 'error');

    const mapped = templatingError(upstreamError(401, { detail: 'Token för 19800101-1234 har gått ut' }));

    expect(mapped.status).toBe(500);
    expect(error).toHaveBeenCalledWith('Templating call failed (status 401, code ERR_BAD_RESPONSE)');
  });

  it('logs a network failure that got no response at all', () => {
    const error = vi.spyOn(logger, 'error');

    templatingError(new AxiosError('connect ECONNREFUSED 10.0.0.1:443', 'ECONNREFUSED'));

    expect(error).toHaveBeenCalledWith('Templating call failed (status none, code ECONNREFUSED)');
  });

  it('passes a refusal the handläggare can act on through without logging it', () => {
    const error = vi.spyOn(logger, 'error');

    expect(templatingError(upstreamError(404, { detail: 'Mallen finns inte' })).message).toBe('Mallen finns inte');
    expect(error).not.toHaveBeenCalled();
  });
});
