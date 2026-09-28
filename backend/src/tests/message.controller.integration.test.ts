import type { Server } from 'node:http';

import { MessageController } from '@controllers/message.controller';
import { User } from '@interfaces/users.interface';
import requestContextMiddleware from '@middlewares/request-context.middleware';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import { sentByHeaders } from '@utils/request-context';
import express from 'express';
import { useExpressServer } from 'routing-controllers';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';

// The route runs @UseBefore(authMiddleware) (passport-backed). Replace it with a pass-through: the user is put on
// the request by the app-level middleware below, the way passport's session does it in the real app, so the test
// exercises the routing-controllers pipeline — multer, the permission guard, the request context — rather than
// authentication. vi.mock is hoisted above the imports above.
vi.mock('@middlewares/auth.middleware', () => ({
  default: (_req: unknown, _res: unknown, next: () => void) => {
    next();
  },
}));

const handlaggare = (canEditErrands: boolean): Partial<User> => ({
  username: 'caseworker01',
  name: 'Case Worker',
  permissions: { canEditErrands, canManageTemplates: false, canViewEventLog: false },
});

describe('POST /errands/:errandId/messages (HTTP integration)', () => {
  let server: Server;
  let baseUrl: string;
  let signedIn: Partial<User>;
  let createMessage: MockInstance<CaremanagementMessageService['createMessage']>;

  beforeEach(async () => {
    signedIn = handlaggare(true);
    createMessage = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const app = express();
    app.use((req, _res, next) => {
      req.user = signedIn;
      next();
    });
    app.use(requestContextMiddleware);
    useExpressServer(app, { controllers: [MessageController] });
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

  // Regression: multer calls next() from a stream event, outside the request context the app-level middleware
  // opened, so caremanagement got the message without X-Sent-By — and logged it without the handläggare.
  it('calls caremanagement as the signed-in handläggare, although multer ran in between', async () => {
    let sentBy: Record<string, string> = {};
    createMessage.mockImplementation(() => {
      sentBy = sentByHeaders();
      return Promise.resolve({ data: null, message: 'success' });
    });
    const form = new FormData();
    form.append('body', 'Hej');
    form.append('files', new Blob(['%PDF-1.7'], { type: 'application/pdf' }), 'intyg.pdf');

    const res = await fetch(`${baseUrl}/errands/errand-1/messages`, { method: 'POST', body: form });

    expect(res.status).toBe(201);
    expect(sentBy).toEqual({ 'X-Sent-By': 'caseworker01; type=adAccount' });
  });

  it('refuses an attachment of a type the sökande should not be sent', async () => {
    const form = new FormData();
    form.append('body', 'Hej');
    form.append('files', new Blob(['<script></script>'], { type: 'text/html' }), 'sida.html');

    const res = await fetch(`${baseUrl}/errands/errand-1/messages`, { method: 'POST', body: form });

    expect(res.status).toBe(400);
    expect(createMessage).not.toHaveBeenCalled();
  });

  it('refuses a handläggare without write permission (403), while they can still read the conversation', async () => {
    signedIn = handlaggare(false);
    vi.spyOn(CaremanagementMessageService.prototype, 'listMessages').mockResolvedValue({ data: [], message: 'success' });
    const form = new FormData();
    form.append('body', 'Hej');

    const write = await fetch(`${baseUrl}/errands/errand-1/messages`, { method: 'POST', body: form });
    const read = await fetch(`${baseUrl}/errands/errand-1/messages`);

    expect(write.status).toBe(403);
    expect(createMessage).not.toHaveBeenCalled();
    expect(read.status).toBe(200);
  });
});
