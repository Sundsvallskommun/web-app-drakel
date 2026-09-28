import { createServer, Server } from 'node:http';

import { gatewayAuthorization } from '@services/api-token.service';
import { logger } from '@utils/logger';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const gateway = vi.hoisted(() => ({ baseUrl: '' }));

vi.mock('@config', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  CLIENT_KEY: 'drakel-client',
  CLIENT_SECRET: 'top-secret-value',
  get API_BASE_URL() {
    return gateway.baseUrl;
  },
}));

describe('gatewayAuthorization', () => {
  let server: Server;

  beforeAll(async () => {
    // A token endpoint that refuses the client.
    server = createServer((_request, response) => {
      response.statusCode = 401;
      response.end('{"error":"invalid_client"}');
    });
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });
    const address = server.address();
    gateway.baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => {
      server.close(() => {
        resolve();
      });
    });
  });

  it('logs a refused token request by status and code only — never the client credentials', async () => {
    const error = vi.spyOn(logger, 'error').mockReturnValue(logger);
    vi.spyOn(logger, 'info').mockReturnValue(logger);
    const basicCredentials = Buffer.from('drakel-client:top-secret-value').toString('base64');

    await expect(gatewayAuthorization()).rejects.toMatchObject({ status: 502 });

    expect(error).toHaveBeenCalledWith('OAuth token endpoint call failed (status 401, code ERR_BAD_REQUEST)');
    const logged = JSON.stringify(error.mock.calls);
    expect(logged).not.toContain(basicCredentials);
    expect(logged).not.toContain('top-secret-value');
  });
});
