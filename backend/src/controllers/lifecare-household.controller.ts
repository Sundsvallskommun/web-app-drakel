import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandLifecareHouseholdService from '@services/errand-lifecare-household.service';
import { Body, Controller, Get, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { FindHouseholdCandidatesDto, HouseholdPersonDto } from '@/dtos/lifecare-household.dto';
import { HouseholdCandidatesApiResponse, LifecareHouseholdApiResponse } from '@/responses/lifecare-household.response';

/**
 * The sökandes hushåll in Lifecare, for the errand's beräkning once it is saved there. Personnummer only ever
 * travel in request bodies — the request log records URLs.
 */
@Controller()
export class LifecareHouseholdController {
  private householdService = new ErrandLifecareHouseholdService();

  @Get('/errands/:errandId/lifecare-household')
  @OpenAPI({ summary: "The sökandes hushåll in Lifecare, and who of it the errand's beräkning takes in" })
  @ResponseSchema(LifecareHouseholdApiResponse)
  @UseBefore(authMiddleware)
  async read(@Param('errandId') errandId: string) {
    return { data: await this.householdService.read(errandId), message: 'success' };
  }

  @Post('/errands/:errandId/lifecare-household/candidates')
  @OpenAPI({ summary: 'Search Lifecare for persons to add as a bonusbarn (by name or personnummer)' })
  @ResponseSchema(HouseholdCandidatesApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(FindHouseholdCandidatesDto, 'body'))
  async candidates(@Param('errandId') errandId: string, @Body() input: FindHouseholdCandidatesDto) {
    return { data: await this.householdService.candidates(errandId, input.filter), message: 'success' };
  }

  @Post('/errands/:errandId/lifecare-household/bonus-children')
  @OpenAPI({ summary: 'Add a bonusbarn to the sökandes hushåll in Lifecare and take them into the beräkning' })
  @UseBefore(authMiddleware, validationMiddleware(HouseholdPersonDto, 'body'))
  async addBonusChild(@Param('errandId') errandId: string, @Body() input: HouseholdPersonDto) {
    await this.householdService.addBonusChild(errandId, input.personId);
    return { data: null, message: 'success' };
  }

  @Post('/errands/:errandId/lifecare-household/calculation-persons')
  @OpenAPI({ summary: 'Take a member or bonusbarn of the hushåll into the beräkning in Lifecare' })
  @UseBefore(authMiddleware, validationMiddleware(HouseholdPersonDto, 'body'))
  async includePerson(@Param('errandId') errandId: string, @Body() input: HouseholdPersonDto) {
    await this.householdService.includePerson(errandId, input.personId);
    return { data: null, message: 'success' };
  }
}
