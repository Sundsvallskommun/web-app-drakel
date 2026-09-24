import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// TODO(treserva-journal): MOCK. Remove this file path — and backend/mock/treserva-journal.pdf — once the
// journal migrated from Treserva is in Lifecare.
const MOCK_JOURNAL_PDF = join(__dirname, '../../mock/treserva-journal.pdf');

/**
 * The applicant's journal migrated from Treserva, as a PDF. The migration will put it in Lifecare as a
 * journalanteckning with the same name in every person's journal, and the Journal tab always shows it first.
 *
 * TODO(treserva-journal): This is a MOCK that serves the same test PDF for every errand, because there is no
 * migrated data in Lifecare yet. When there is:
 * - find the journalanteckning by its fixed name in the person's Lifecare journal (the same person-wide list
 *   LifecareDocumentsService reads for the Journal tab);
 * - read its PDF from Lifecare, the way the Journal tab reads a record's content;
 * - log the read on the errand (LifecareAccessLogService, target JOURNAL_NOTE), as every Lifecare read is;
 * - answer 404 when the person has no migrated journal, so the button can say so.
 */
class TreservaJournalService {
  // `errandId` is unused by the mock; the real read looks up the errand's person with it.
  async read(_errandId: string): Promise<Buffer> {
    return readFile(MOCK_JOURNAL_PDF);
  }
}

export default TreservaJournalService;
