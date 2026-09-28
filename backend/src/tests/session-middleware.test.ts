import type { Server } from 'node:http';

import { sessionMiddleware } from '@utils/session-middleware';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({ NODE_ENV: 'development' }));

// An in-memory store, so the test leaves no session files behind; NODE_ENV is switched per test.
vi.mock('@config', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  SESSION_MEMORY: true,
  SECRET_KEY: 'a-test-secret-that-is-long-enough-to-sign',
  get NODE_ENV() {
    return config.NODE_ENV;
  },
}));

/** The session cookie a request that starts a session is answered with. */
const sessionCookie = async (headers: Record<string, string> = {}): Promise<string> => {
  const app = express();
  app.set('trust proxy', 1);
  app.use(sessionMiddleware());
  app.get('/login', (req, res) => {
    (req.session as unknown as { started: boolean }).started = true;
    res.end();
  });
  const server = await new Promise<Server>(resolve => {
    const listening = app.listen(0, () => {
      resolve(listening);
    });
  });
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/login`, { headers });
    return response.headers.get('set-cookie') ?? '';
  } finally {
    server.close();
  }
};

describe('sessionMiddleware', () => {
  afterEach(() => {
    config.NODE_ENV = 'development';
  });

  it('sets a session cookie script cannot read, that is not sent cross-site and lasts a working day', async () => {
    const cookie = await sessionCookie();

    expect(cookie).toMatch(/^drakel\.sid=/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Secure');
    const expires = Date.parse(/Expires=([^;]+)/.exec(cookie)?.[1] ?? '');
    const eightHours = 8 * 60 * 60 * 1000;
    expect(Math.abs(expires - Date.now() - eightHours)).toBeLessThan(60 * 1000);
  });

  it('marks the cookie Secure in production, behind the proxy that terminates HTTPS', async () => {
    config.NODE_ENV = 'production';

    expect(await sessionCookie({ 'X-Forwarded-Proto': 'https' })).toContain('Secure');
  });
});
