import type { Server } from 'node:http';

import { MessageController } from '@controllers/message.controller';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import type { Application } from 'express';
import { createExpressServer } from 'routing-controllers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The route runs @UseBefore(authMiddleware) (passport-backed). Replace it with a pass-through that
// stamps a user, so the test exercises the routing-controllers parameter pipeline — the actual bug
// surface — rather than authentication. vi.mock is hoisted above the imports above.
vi.mock('@middlewares/auth.middleware', () => ({
  default: (req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = { username: 'caseworker01', name: 'Case Worker' };
    next();
  },
}));

describe('POST /errands/:errandId/messages (HTTP integration)', () => {
  let server: Server;
  let baseUrl: string;
  let createMessage: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    createMessage = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const app = createExpressServer({ controllers: [MessageController] }) as Application;
    await new Promise<void>(resolve => {
      server = app.listen(0, () => {
        resolve();
      });
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await new Promise<void>((resolve, reject) => {
      server.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

  // Regression: a plain multipart `body` text field must NOT be JSON-parsed by routing-controllers.
  // With `@BodyParam('body') body: unknown` this returned 400 "cannot be parsed into JSON"; typing the
  // param as `string` returns the value verbatim and reaches the handler.
  it('accepts a plain-text body field and forwards it (no JSON parsing)', async () => {
    const form = new FormData();
    form.append('body', 'test 2');

    const res = await fetch(`${baseUrl}/errands/errand-1/messages`, { method: 'POST', body: form });

    expect(res.status).toBe(201);
    expect(createMessage).toHaveBeenCalledWith('errand-1', { direction: 'OUTBOUND', body: 'test 2', author: 'caseworker01' }, []);
  });

  it('rejects an empty body with 400 without calling caremanagement', async () => {
    const form = new FormData();
    form.append('body', '   ');

    const res = await fetch(`${baseUrl}/errands/errand-1/messages`, { method: 'POST', body: form });

    expect(res.status).toBe(400);
    expect(createMessage).not.toHaveBeenCalled();
  });
});
