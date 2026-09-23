import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandLifecareRecordsService from '@services/errand-lifecare-records.service';
import { Body, Controller, Get, HttpCode, Param, Post, Put, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { CreateLifecareDocumentDto, CreateLifecareJournalNoteDto, UpdateLifecareRecordDto } from '@/dtos/lifecare-documents.dto';
import { LifecareDocumentTypesApiResponse } from '@/responses/lifecare-document-proposal.response';
import { LifecareRecordApiResponse, LifecareRecordContentApiResponse, LifecareRecordsApiResponse } from '@/responses/lifecare-documents.response';
import { LifecareNoteTypesApiResponse } from '@/responses/lifecare-journal-note.response';

/**
 * Serves the applicant's Lifecare record — journalanteckningar and documents — for an errand, read and
 * written live in Lifecare. Nothing is kept in careM; careM only gets the access-log rows.
 *
 * Keyed by errand, not by identity number: the errand resolves to the applicant's personnummer and
 * insats on the server, so no personal number is ever passed in drakel's own URL. Lifecare's list is
 * person-wide, so what comes back spans all of the person's akter, not only this errand.
 */
@Controller()
export class LifecareDocumentsController {
  private recordsService = new ErrandLifecareRecordsService();

  @Get('/errands/:errandId/lifecare-documents')
  @OpenAPI({ summary: "The applicant's documents and journalanteckningar read from Lifecare" })
  @ResponseSchema(LifecareRecordsApiResponse)
  @UseBefore(authMiddleware)
  async listDocuments(@Param('errandId') errandId: string) {
    return { data: await this.recordsService.list(errandId), message: 'success' };
  }

  @Get('/errands/:errandId/lifecare-documents/journal-note-types')
  @OpenAPI({ summary: "The note types a new journalanteckning on the errand's insats can have" })
  @ResponseSchema(LifecareNoteTypesApiResponse)
  @UseBefore(authMiddleware)
  async listJournalNoteTypes(@Param('errandId') errandId: string) {
    return { data: await this.recordsService.journalNoteTypes(errandId), message: 'success' };
  }

  @Post('/errands/:errandId/lifecare-documents/journal-notes')
  @HttpCode(201)
  @OpenAPI({ summary: "Write a new journalanteckning on the errand's insats in Lifecare" })
  @ResponseSchema(LifecareRecordApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(CreateLifecareJournalNoteDto, 'body'))
  async createJournalNote(@Param('errandId') errandId: string, @Body() input: CreateLifecareJournalNoteDto) {
    return { data: await this.recordsService.createJournalNote(errandId, input), message: 'success' };
  }

  @Get('/errands/:errandId/lifecare-documents/document-types')
  @OpenAPI({ summary: "The document types a new document on the errand's insats can have" })
  @ResponseSchema(LifecareDocumentTypesApiResponse)
  @UseBefore(authMiddleware)
  async listDocumentTypes(@Param('errandId') errandId: string) {
    return { data: await this.recordsService.documentTypes(errandId), message: 'success' };
  }

  @Post('/errands/:errandId/lifecare-documents/documents')
  @HttpCode(201)
  @OpenAPI({ summary: "Write a new document on the errand's insats in Lifecare" })
  @ResponseSchema(LifecareRecordApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(CreateLifecareDocumentDto, 'body'))
  async createDocument(@Param('errandId') errandId: string, @Body() input: CreateLifecareDocumentDto) {
    return { data: await this.recordsService.createDocument(errandId, input), message: 'success' };
  }

  @Get('/errands/:errandId/lifecare-documents/journal-notes/:id')
  @OpenAPI({ summary: 'Read a Lifecare journalanteckning with its body' })
  @ResponseSchema(LifecareRecordContentApiResponse)
  @UseBefore(authMiddleware)
  async readJournalNote(@Param('errandId') errandId: string, @Param('id') id: string) {
    return { data: await this.recordsService.readJournalNote(errandId, id), message: 'success' };
  }

  @Get('/errands/:errandId/lifecare-documents/documents/:id')
  @OpenAPI({ summary: 'Read a Lifecare document with its body' })
  @ResponseSchema(LifecareRecordContentApiResponse)
  @UseBefore(authMiddleware)
  async readDocument(@Param('errandId') errandId: string, @Param('id') id: string) {
    return { data: await this.recordsService.readDocument(errandId, id), message: 'success' };
  }

  @Put('/errands/:errandId/lifecare-documents/journal-notes/:id')
  @OpenAPI({ summary: 'Save an edit to a Lifecare journalanteckning (if not finalised)' })
  @ResponseSchema(LifecareRecordContentApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(UpdateLifecareRecordDto, 'body'))
  async updateJournalNote(@Param('errandId') errandId: string, @Param('id') id: string, @Body() input: UpdateLifecareRecordDto) {
    return { data: await this.recordsService.updateJournalNote(errandId, id, input), message: 'success' };
  }

  @Put('/errands/:errandId/lifecare-documents/documents/:id')
  @OpenAPI({ summary: 'Save an edit to a Lifecare document (if not finalised)' })
  @ResponseSchema(LifecareRecordContentApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(UpdateLifecareRecordDto, 'body'))
  async updateDocument(@Param('errandId') errandId: string, @Param('id') id: string, @Body() input: UpdateLifecareRecordDto) {
    return { data: await this.recordsService.updateDocument(errandId, id, input), message: 'success' };
  }
}
