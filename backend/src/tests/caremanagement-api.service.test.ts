import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';

import CaremanagementApiService from '@services/caremanagement-api.service';
import { runWithRequestContext } from '@utils/request-context';
import FormData from 'form-data';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// No gateway in a test: the token caremanagement is called with (when it has no host of its own) is a stand-in.
vi.mock('@services/api-token.service', () => ({
  gatewayAuthorization: () => Promise.resolve({ Authorization: 'Bearer test-token' }),
}));

/** What the stand-in for caremanagement received. */
interface Received {
  url?: string;
  headers: IncomingMessage['headers'];
  body: string;
}

describe('CaremanagementApiService (against a local stand-in for caremanagement)', () => {
  let server: Server;
  let baseUrl: string;
  let received: Received;
  let respond: (response: ServerResponse) => void;

  beforeEach(async () => {
    received = { headers: {}, body: '' };
    respond = response => {
      response.statusCode = 201;
      response.end();
    };
    server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        received = { url: request.url, headers: request.headers, body: Buffer.concat(chunks).toString('latin1') };
        respond(response);
      });
    });
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  });

  afterEach(async () => {
    await new Promise<void>(resolve => {
      server.close(() => {
        resolve();
      });
    });
  });

  it('posts a multipart form with its own boundary, the query and the acting handläggare', async () => {
    const form = new FormData();
    form.append('file', Buffer.from('%PDF-1.7'), { filename: 'beslut.pdf', contentType: 'application/pdf' });

    await runWithRequestContext({ username: 'caseworker01' }, () =>
      new CaremanagementApiService().postMultipart({ url: `${baseUrl}/errands/errand-1/attachments`, form, params: { documentType: 'DECISION' } }),
    );

    expect(received.url).toBe('/errands/errand-1/attachments?documentType=DECISION');
    expect(received.headers['content-type']).toMatch(/^multipart\/form-data; boundary=/);
    expect(received.headers['x-sent-by']).toBe('caseworker01; type=adAccount');
    expect(received.headers.authorization).toBe('Bearer test-token');
    expect(received.body).toContain('filename="beslut.pdf"');
    expect(received.body).toContain('%PDF-1.7');
  });

  it('reads a file with the content type and the name its headers give', async () => {
    respond = response => {
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader('Content-Disposition', `attachment; filename="100%.pdf"; filename*=UTF-8''100%25%20%C3%A5r.pdf`);
      response.end('%PDF-1.7');
    };

    const file = await new CaremanagementApiService().getFile(`${baseUrl}/errands/errand-1/attachments/1/file`);

    expect(file.contentType).toBe('application/pdf');
    expect(file.fileName).toBe('100% år.pdf');
    expect(file.data.toString()).toBe('%PDF-1.7');
  });

  it("passes caremanagement's refusal of an upload on with its status", async () => {
    respond = response => {
      response.statusCode = 413;
      response.end();
    };
    const form = new FormData();
    form.append('file', Buffer.from('%PDF-1.7'), { filename: 'stor.pdf' });

    await expect(new CaremanagementApiService().postMultipart({ url: `${baseUrl}/errands/errand-1/attachments`, form })).rejects.toMatchObject({
      status: 413,
    });
  });
});
