import { LIFECARE_CLIENT_ID_OVERRIDE, NODE_ENV } from '@config';
import { HttpException } from '@exceptions/HttpException';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import LifecareDocumentsService from '@services/lifecare-documents.service';
import { Body, Controller, Get, Param, Put, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { UpdateLifecareRecordDto } from '@/dtos/lifecare-documents.dto';
import { LifecareRecordContentApiResponse, LifecareRecordsApiResponse, toLifecareRecords } from '@/responses/lifecare-documents.response';

/** The stakeholder role whose Lifecare record the tab shows. */
const APPLICANT_ROLE = 'APPLICANT';

/**
 * Serves the applicant's Lifecare record — journalanteckningar and documents — for an errand.
 *
 * Keyed by errand, not by identity number: the errand's applicant is resolved to a personnummer
 * here (via the stakeholder + Citizen services), so no personal number is ever passed in drakel's
 * own URL. Lifecare's list is person-wide, so what comes back spans all of the person's akter, not
 * only this errand.
 */
@Controller()
export class LifecareDocumentsController {
  private documentsService = new LifecareDocumentsService();
  private stakeholderService = new CaremanagementStakeholderService();

  @Get('/errands/:errandId/lifecare-documents')
  @OpenAPI({ summary: "The applicant's documents and journalanteckningar read from Lifecare" })
  @ResponseSchema(LifecareRecordsApiResponse)
  @UseBefore(authMiddleware)
  async listDocuments(@Param('errandId') errandId: string) {
    const identityNumber = await this.resolveClientId(errandId);
    const res = await this.documentsService.listForClient(identityNumber);
    return { data: toLifecareRecords(res.data), message: 'success' };
  }

  @Get('/lifecare-documents/journal-notes/:id')
  @OpenAPI({ summary: 'Read a Lifecare journalanteckning with its body' })
  @ResponseSchema(LifecareRecordContentApiResponse)
  @UseBefore(authMiddleware)
  async readJournalNote(@Param('id') id: string) {
    return this.documentsService.readJournalNote(id);
  }

  @Get('/lifecare-documents/documents/:id')
  @OpenAPI({ summary: 'Read a Lifecare document with its body' })
  @ResponseSchema(LifecareRecordContentApiResponse)
  @UseBefore(authMiddleware)
  async readDocument(@Param('id') id: string) {
    return this.documentsService.readDocument(id);
  }

  @Put('/lifecare-documents/journal-notes/:id')
  @OpenAPI({ summary: 'Save an edit to a Lifecare journalanteckning (if not finalised)' })
  @ResponseSchema(LifecareRecordContentApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(UpdateLifecareRecordDto, 'body'))
  async updateJournalNote(@Param('id') id: string, @Body() input: UpdateLifecareRecordDto) {
    return this.documentsService.updateJournalNote(id, input);
  }

  @Put('/lifecare-documents/documents/:id')
  @OpenAPI({ summary: 'Save an edit to a Lifecare document (if not finalised)' })
  @ResponseSchema(LifecareRecordContentApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(UpdateLifecareRecordDto, 'body'))
  async updateDocument(@Param('id') id: string, @Body() input: UpdateLifecareRecordDto) {
    return this.documentsService.updateDocument(id, input);
  }

  /**
   * The identity number Lifecare knows the applicant by.
   *
   * In development a configured override wins, so the tab can be tested against a known Lifecare
   * test person whose reserve number the Citizen API cannot produce. Otherwise it is the applicant
   * stakeholder's personnummer, resolved from their partyId.
   */
  private async resolveClientId(errandId: string): Promise<string> {
    if (NODE_ENV === 'development' && LIFECARE_CLIENT_ID_OVERRIDE) {
      return LIFECARE_CLIENT_ID_OVERRIDE;
    }

    const stakeholders = await this.stakeholderService.readStakeholders(errandId);
    const applicant = (stakeholders.data ?? []).find(stakeholder => stakeholder.role === APPLICANT_ROLE);
    if (!applicant?.personalNumber) {
      throw new HttpException(404, "Could not resolve the applicant's identity number for this errand");
    }
    return applicant.personalNumber;
  }
}
