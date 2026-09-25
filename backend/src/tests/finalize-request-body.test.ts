import { assertOnlyPdfs, parseFinalizeRequest } from '@utils/finalize-request-body';
import { describe, expect, it } from 'vitest';

describe('parseFinalizeRequest', () => {
  it('reads the request the multipart field carries as JSON', async () => {
    const input = await parseFinalizeRequest(
      JSON.stringify({ meddelande: true, brev: true, message: 'Hej,', includeDecision: true, includeCalculation: false }),
    );

    expect(input).toMatchObject({ meddelande: true, brev: true, message: 'Hej,', includeDecision: true, includeCalculation: false });
  });

  it('refuses a request that is missing, not JSON or not complete', async () => {
    await expect(parseFinalizeRequest(undefined)).rejects.toMatchObject({ status: 400 });
    await expect(parseFinalizeRequest('inte json')).rejects.toMatchObject({ status: 400 });
    await expect(parseFinalizeRequest(JSON.stringify({ meddelande: true }))).rejects.toMatchObject({ status: 400 });
  });
});

describe('assertOnlyPdfs', () => {
  it('lets PDFs through and refuses any other file, naming it', () => {
    expect(() => {
      assertOnlyPdfs([{ mimetype: 'application/pdf', originalname: 'intyg.pdf' }]);
    }).not.toThrow();
    expect(() => {
      assertOnlyPdfs([{ mimetype: 'image/png', originalname: 'kvitto.png' }]);
    }).toThrow('kvitto.png är inte en PDF');
  });
});
