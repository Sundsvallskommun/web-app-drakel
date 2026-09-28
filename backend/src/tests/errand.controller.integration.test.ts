import type { Server } from 'node:http';

import { ErrandController } from '@controllers/errand.controller';
import ApplicantNameService from '@services/applicant-name.service';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { STRICT_VALIDATION } from '@utils/validate-input';
import express from 'express';
import { useExpressServer } from 'routing-controllers';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';

// Authentication is not what is under test: the route's authMiddleware lets every request through.
vi.mock('@middlewares/auth.middleware', () => ({
  default: (_req: unknown, _res: unknown, next: () => void) => {
    next();
  },
}));

describe('GET /errands (HTTP integration)', () => {
  let server: Server;
  let baseUrl: string;
  let get: MockInstance<CaremanagementApiService['get']>;

  beforeAll(async () => {
    const app = express();
    // Validated as the app validates every DTO (see app.ts).
    useExpressServer(app, { controllers: [ErrandController], validation: STRICT_VALIDATION });
    await new Promise<void>(resolve => {
      server = app.listen(0, () => {
        resolve();
      });
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => {
      server.close(() => {
        resolve();
      });
    });
  });

  beforeEach(() => {
    get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: { errands: [] }, message: 'success', status: 200 });
    vi.spyOn(ApplicantNameService.prototype, 'addApplicantNames').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** The query parameters the search sent caremanagement. */
  const forwardedParams = (): unknown => get.mock.calls[0]?.[0].params;

  it('forwards a single sort, which the query string gives as a plain string, as a sort list', async () => {
    const response = await fetch(`${baseUrl}/errands?sort=created,desc&page=0&size=25`);

    expect(response.status).toBe(200);
    expect(forwardedParams()).toMatchObject({ sort: ['created,desc'], page: 0, size: 25 });
  });

  it('forwards repeated sort parameters in order', async () => {
    const response = await fetch(`${baseUrl}/errands?sort=status,asc&sort=created,desc`);

    expect(response.status).toBe(200);
    expect(forwardedParams()).toMatchObject({ sort: ['status,asc', 'created,desc'] });
  });

  it('refuses a query parameter the search does not name, rather than passing it on to caremanagement', async () => {
    const response = await fetch(`${baseUrl}/errands?namespace=OTHER`);

    expect(response.status).toBe(400);
    expect(get).not.toHaveBeenCalled();
  });
});
