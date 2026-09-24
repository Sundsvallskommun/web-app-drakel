import authMiddleware from '@middlewares/auth.middleware';
import TemplatingService from '@services/templating.service';
import { isDecisionPhrase, toDecisionPhraseSummary } from '@utils/decision-phrase';
import { Controller, Get, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { DecisionPhrasesApiResponse } from '@/responses/decision-phrase.response';

/**
 * The beslutsformuleringar the Beslut tab's two pickers offer — kategori, then rubrik. They live in Templating
 * and are edited on the admin page; a phrase's text is read when it is added (`/document-templates/:identifier`).
 */
@Controller()
export class DecisionPhraseController {
  private templatingService = new TemplatingService();

  @Get('/decision-phrases')
  @OpenAPI({ summary: 'List the beslutsformuleringar (kategori and rubrik) for the Beslut tab' })
  @ResponseSchema(DecisionPhrasesApiResponse)
  @UseBefore(authMiddleware)
  async listPhrases() {
    const all = await this.templatingService.listTemplates();
    return { data: all.filter(isDecisionPhrase).map(toDecisionPhraseSummary), message: 'success' };
  }
}
