import { assertOnlyPdfs, parseFinalizeRequest } from '@utils/finalize-request-body';
import { describe, expect, it } from 'vitest';

describe('parseFinalizeRequest', () => {
  it('reads the request the multipart field carries as JSON', async () => {
    const input = await parseFinalizeRequest(
      JSON.stringify({
        meddelande: true,
        brev: true,
        message: 'Hej,',
        includeDecision: true,
        includeCalculation: false,
        lifecareDocumentIds: ['12'],
      }),
    );

    expect(input).toMatchObject({
      meddelande: true,
      brev: true,
      message: 'Hej,',
      includeDecision: true,
      includeCalculation: false,
      lifecareDocumentIds: ['12'],
    });
  });

  it('refuses a request that is missing, not JSON or not complete', async () => {
    await expect(parseFinalizeRequest(undefined)).rejects.toMatchObject({ status: 400 });
    await expect(parseFinalizeRequest('inte json')).rejects.toMatchObject({ status: 400 });
    await expect(parseFinalizeRequest(JSON.stringify({ meddelande: true }))).rejects.toMatchObject({ status: 400 });
  });

  it('refuses a request carrying anything the DTO does not name', async () => {
    const request = { meddelande: true, brev: false, message: 'Hej,', includeDecision: true, includeCalculation: false, lifecareDocumentIds: [] };

    await expect(parseFinalizeRequest(JSON.stringify({ ...request, amount: 5000 }))).rejects.toMatchObject({ status: 400 });
  });
});

describe('assertOnlyPdfs', () => {
  const pdf = Buffer.from('%PDF-1.7\n…');

  it('lets PDFs through and refuses any other file, naming it', () => {
    expect(() => {
      assertOnlyPdfs([{ buffer: pdf, mimetype: 'application/pdf', originalname: 'intyg.pdf' }]);
    }).not.toThrow();
    expect(() => {
      assertOnlyPdfs([{ buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]), mimetype: 'image/png', originalname: 'kvitto.png' }]);
    }).toThrow('kvitto.png är inte en PDF');
  });

  it('refuses a file the browser calls a PDF that does not start like one', () => {
    expect(() => {
      assertOnlyPdfs([{ buffer: Buffer.from('<html><script></script></html>'), mimetype: 'application/pdf', originalname: 'beslut.pdf' }]);
    }).toThrow('beslut.pdf är inte en PDF');
  });
});
