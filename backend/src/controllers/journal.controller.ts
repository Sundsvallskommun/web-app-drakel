import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementJournalService from '@services/caremanagement-journal.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { CreateJournalEntry, UpdateJournalEntry } from '@/data-contracts/caremanagement/data-contracts';
import { CreateJournalEntryDto, UpdateJournalEntryDto } from '@/dtos/journal.dto';
import {
  JournalEntriesApiResponse,
  JournalEntryApiResponse,
  JournalEntryTypesApiResponse,
} from '@/responses/journal.response';

/** Owns the journalanteckning (case-journal) sub-resource of an errand. */
@Controller()
export class JournalController {
  private journalService = new CaremanagementJournalService();

  @Get('/journal-entries/types')
  @OpenAPI({ summary: 'The selectable journal entry types (Lifecare Typ catalogue)' })
  @ResponseSchema(JournalEntryTypesApiResponse)
  @UseBefore(authMiddleware)
  async getTypes() {
    const res = await this.journalService.readTypes();
    return { data: res.data?.types ?? [], message: 'success' };
  }

  @Get('/errands/:errandId/journal-entries')
  @OpenAPI({ summary: 'List the journalanteckningar on an errand' })
  @ResponseSchema(JournalEntriesApiResponse)
  @UseBefore(authMiddleware)
  async listEntries(@Param('errandId') errandId: string) {
    const res = await this.journalService.readEntries(errandId);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/journal-entries')
  @OpenAPI({ summary: 'Create a journalanteckning on an errand' })
  @ResponseSchema(JournalEntryApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(CreateJournalEntryDto, 'body'))
  async createEntry(@Req() req: RequestWithUser, @Param('errandId') errandId: string, @Body() input: CreateJournalEntryDto) {
    const body: CreateJournalEntry = {
      type: input.type,
      heading: input.heading,
      text: input.text,
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      createdBy: req.user.username,
    };
    const res = await this.journalService.createEntry(errandId, body);
    return { data: res.data, message: 'success' };
  }

  @Patch('/errands/:errandId/journal-entries/:entryId')
  @OpenAPI({ summary: 'Edit a WORKING journalanteckning' })
  @ResponseSchema(JournalEntryApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(UpdateJournalEntryDto, 'body'))
  async updateEntry(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    @Param('entryId') entryId: string,
    @Body() input: UpdateJournalEntryDto,
  ) {
    const body: UpdateJournalEntry = {
      type: input.type,
      heading: input.heading,
      text: input.text,
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      modifiedBy: req.user.username,
    };
    const res = await this.journalService.updateEntry(errandId, entryId, body);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/journal-entries/:entryId/lock')
  @OpenAPI({ summary: 'Lock a journalanteckning into an upprättad handling' })
  @ResponseSchema(JournalEntryApiResponse)
  @UseBefore(authMiddleware)
  async lockEntry(@Req() req: RequestWithUser, @Param('errandId') errandId: string, @Param('entryId') entryId: string) {
    const res = await this.journalService.lockEntry(errandId, entryId, { lockedBy: req.user.username });
    return { data: res.data, message: 'success' };
  }

  @Delete('/errands/:errandId/journal-entries/:entryId')
  @OpenAPI({ summary: 'Delete a journalanteckning' })
  @UseBefore(authMiddleware)
  async deleteEntry(@Param('errandId') errandId: string, @Param('entryId') entryId: string) {
    await this.journalService.deleteEntry(errandId, entryId);
    return { data: null, message: 'success' };
  }
}
