import type { Server } from 'node:http';

import { AttachmentFile } from '@interfaces/file.interface';
import { fileNameFromDisposition } from '@utils/content-disposition';
import { sendAttachment } from '@utils/send-attachment';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('fileNameFromDisposition', () => {
  it('prefers the extended filename*= and decodes it', () => {
    expect(fileNameFromDisposition(`attachment; filename="???.pdf"; filename*=UTF-8''%E2%80%9C%E2%80%93%E2%80%9D.pdf`)).toBe('“–”.pdf');
  });

  it('takes a plain filename as it stands — a % in it is not an escape', () => {
    expect(fileNameFromDisposition('attachment; filename="100%.pdf"')).toBe('100%.pdf');
    expect(fileNameFromDisposition('attachment; filename=intyg.pdf')).toBe('intyg.pdf');
  });

  it('unescapes a quoted filename', () => {
    expect(fileNameFromDisposition('attachment; filename="Beslut \\"slutligt\\".pdf"')).toBe('Beslut "slutligt".pdf');
  });

  it('falls back on the plain filename when the extended one cannot be decoded', () => {
    expect(fileNameFromDisposition(`attachment; filename="intyg.pdf"; filename*=UTF-8''%E2%80.pdf`)).toBe('intyg.pdf');
  });

  it('has no name for a missing header', () => {
    expect(fileNameFromDisposition(undefined)).toBeUndefined();
  });
});

describe('sendAttachment', () => {
  let server: Server;
  let baseUrl: string;
  let file: AttachmentFile;

  beforeAll(async () => {
    const app = express();
    app.get('/file', (_req, res) => {
      sendAttachment(res, file, 'attachment-1');
    });
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

  const download = async (fileName: string | undefined): Promise<Response> => {
    file = { data: Buffer.from('%PDF-1.7'), contentType: 'application/pdf', fileName };
    return fetch(`${baseUrl}/file`);
  };

  it.each(['100% klart.pdf', 'Beslut – “slutligt”.pdf', 'Beslut "slutligt".pdf', 'Hyresavi för Åsa Öberg-Ängel.pdf', 'a%20b.pdf'])(
    'sends %s as a download whose name reads back unchanged',
    async fileName => {
      const response = await download(fileName);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
      expect(fileNameFromDisposition(response.headers.get('content-disposition') ?? undefined)).toBe(fileName);
      expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('%PDF-1.7');
    },
  );

  it('writes the header in plain ASCII, the name itself in the encoded filename*=', async () => {
    const response = await download('Hyresavi för Åsa.pdf');

    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="Hyresavi for Asa.pdf"; filename*=UTF-8\'\'Hyresavi%20f%C3%B6r%20%C3%85sa.pdf',
    );
  });

  it('names the file by the fallback when upstream gave no name', async () => {
    const response = await download(undefined);

    expect(fileNameFromDisposition(response.headers.get('content-disposition') ?? undefined)).toBe('attachment-1');
  });
});
