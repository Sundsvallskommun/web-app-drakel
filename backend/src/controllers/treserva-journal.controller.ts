import authMiddleware from '@middlewares/auth.middleware';
import TreservaJournalService from '@services/treserva-journal.service';
import { Controller, Get, Param, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { TreservaJournalApiResponse } from '@/responses/treserva-journal.response';

/** The journal migrated from Treserva, shown first on the Journal tab. MOCK until the migrated data is in Lifecare. */
@Controller()
export class TreservaJournalController {
  private treservaJournal = new TreservaJournalService();

  @Get('/errands/:errandId/treserva-journal')
  @OpenAPI({ summary: 'The journal migrated from Treserva, as a PDF (MOCK: the same test PDF for every errand)' })
  @ResponseSchema(TreservaJournalApiResponse)
  @UseBefore(authMiddleware)
  async read(@Param('errandId') errandId: string) {
    const pdf = await this.treservaJournal.read(errandId);
    return { data: pdf.toString('base64'), message: 'success' };
  }
}
