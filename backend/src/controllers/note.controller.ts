import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementNoteService from '@services/caremanagement-note.service';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import { CreateNoteDto, UpdateNoteDto } from '@/dtos/note.dto';

@Controller()
export class NoteController {
  private noteService = new CaremanagementNoteService();

  @Get('/errands/:errandId/notes')
  @OpenAPI({ summary: 'List the notes on an errand' })
  @UseBefore(authMiddleware)
  async listNotes(@Param('errandId') errandId: string) {
    const res = await this.noteService.listNotes(errandId);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/notes')
  @HttpCode(201)
  @OpenAPI({ summary: 'Add a note to an errand' })
  @UseBefore(authMiddleware, validationMiddleware(CreateNoteDto, 'body'))
  async createNote(@Req() req: RequestWithUser, @Param('errandId') errandId: string, @Body() note: CreateNoteDto) {
    // The author is the signed-in handläggare — taken from the session, never trusted from the client.
    const res = await this.noteService.createNote(errandId, { body: note.body, author: req.user.username });
    return { data: res.data, message: 'success' };
  }

  @Patch('/errands/:errandId/notes/:noteId')
  @OpenAPI({ summary: 'Update a note on an errand' })
  @UseBefore(authMiddleware, validationMiddleware(UpdateNoteDto, 'body'))
  async updateNote(@Param('errandId') errandId: string, @Param('noteId') noteId: string, @Body() note: UpdateNoteDto) {
    const res = await this.noteService.updateNote(errandId, noteId, { body: note.body });
    return { data: res.data, message: 'success' };
  }

  @Delete('/errands/:errandId/notes/:noteId')
  @OpenAPI({ summary: 'Delete a note from an errand' })
  @UseBefore(authMiddleware)
  async deleteNote(@Param('errandId') errandId: string, @Param('noteId') noteId: string) {
    await this.noteService.deleteNote(errandId, noteId);
    return { data: null, message: 'success' };
  }
}
