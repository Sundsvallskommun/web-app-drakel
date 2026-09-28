import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { discardData, mapData, unwrapData } from './api-service';

const refusal = (status: number, message: string): AxiosError =>
  new AxiosError('refused', 'ERR_BAD_REQUEST', undefined, undefined, {
    data: { message },
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe('unwrapData', () => {
  it("hands back the envelope's data", async () => {
    expect(await unwrapData(Promise.resolve({ data: { data: [1, 2] } }))).toEqual({ data: [1, 2] });
  });

  it("turns a refusal into the error shape, with the backend's message", async () => {
    expect(await unwrapData(Promise.reject(refusal(403, 'Saknar behörighet')))).toEqual({
      error: 403,
      message: 'Saknar behörighet',
    });
  });
});

describe('mapData', () => {
  it('passes the data through the transform', async () => {
    expect(await mapData(Promise.resolve({ data: { data: undefined } }), (value) => value ?? null)).toEqual({
      data: null,
    });
  });
});

describe('discardData', () => {
  it('resolves with no data, or the error shape', async () => {
    expect(await discardData(Promise.resolve({ data: 'ignored' }))).toEqual({ data: null });
    expect(await discardData(Promise.reject(new Error('network')))).toEqual({ error: 'UNKNOWN ERROR' });
  });
});
