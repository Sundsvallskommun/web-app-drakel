import authMiddleware from '@middlewares/auth.middleware';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import CaremanagementNoteService from '@services/caremanagement-note.service';
import CaremanagementWarningService from '@services/caremanagement-warning.service';
import { Controller, Get, Param, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { ErrandCountsApiResponse } from '@/responses/counts.response';

/**
 * Aggregates the per-errand badge counts (notes, active warnings, unread messages) into one call. The
 * caremanagement count endpoints are unlogged, so polling them for sidebar badges doesn't pollute the
 * event log. Bevakningar are not counted here: they live in Lifecare, and the sidebar counts the list it
 * reads from there.
 */
@Controller()
export class CountsController {
  private noteService = new CaremanagementNoteService();
  private warningService = new CaremanagementWarningService();
  private messageService = new CaremanagementMessageService();

  @Get('/errands/:errandId/counts')
  @OpenAPI({ summary: 'Badge counts for an errand (notes, warnings, unread messages) — unlogged' })
  @ResponseSchema(ErrandCountsApiResponse)
  @UseBefore(authMiddleware)
  async getCounts(@Param('errandId') errandId: string) {
    // The financial-assistance counts 404 for non-FA errands, so default each to 0 on failure rather
    // than failing the whole badge request.
    const [notes, warnings, unreadMessages] = await Promise.all([
      this.noteService
        .readCount(errandId)
        .then(res => res.data?.count ?? 0)
        .catch(() => 0),
      this.warningService
        .readCount(errandId)
        .then(res => res.data?.count ?? 0)
        .catch(() => 0),
      this.messageService
        .readUnreadCount(errandId)
        .then(res => res.data?.unreadCount ?? 0)
        .catch(() => 0),
    ]);
    return { data: { notes, warnings, unreadMessages }, message: 'success' };
  }
}
