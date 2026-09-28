import { apiService } from '@services/api-service';
import axios, { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getErrand, getErrands } from './errand-service';

vi.mock('@services/api-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@services/api-service')>()),
  apiService: { get: vi.fn() },
}));

const RESPONSE: AxiosResponse = {
  data: { data: { errands: [] }, message: 'success' },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: new AxiosHeaders() },
};

/** The query string axios builds from the config a service handed it. */
const queryStringOf = (config?: AxiosRequestConfig): string =>
  decodeURIComponent(axios.getUri({ ...config, url: 'errands' }).split('?')[1] ?? '');

describe('errand-service', () => {
  beforeEach(() => {
    vi.mocked(apiService.get).mockReset().mockResolvedValue(RESPONSE);
  });

  it('sends several sort orders as repeated sort parameters, which the backend reads', async () => {
    await getErrands({ page: 0, size: 12, sort: ['status,asc', 'created,desc'] });

    const config = vi.mocked(apiService.get).mock.calls[0]?.[1];
    expect(queryStringOf(config)).toBe('page=0&size=12&sort=status,asc&sort=created,desc');
  });

  it('encodes the errand id as one path segment', async () => {
    await getErrand('../admin?x=1');

    expect(apiService.get).toHaveBeenCalledWith('errands/..%2Fadmin%3Fx%3D1');
  });
});
