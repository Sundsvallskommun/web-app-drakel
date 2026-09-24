import TreservaJournalService from '@services/treserva-journal.service';
import { describe, expect, it } from 'vitest';

describe('TreservaJournalService (mock)', () => {
  it('serves the test journal as a PDF until the migrated journal is in Lifecare', async () => {
    const pdf = await new TreservaJournalService().read('errand-1');

    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});
