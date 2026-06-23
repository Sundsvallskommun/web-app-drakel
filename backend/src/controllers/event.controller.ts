import authMiddleware from '@middlewares/auth.middleware';
import CaremanagementEventService from '@services/caremanagement-event.service';
import { Controller, Get, Param, QueryParam, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { ErrandEventsApiResponse } from '@/responses/event.response';

/** Exposes the per-errand activity log (event log) — who read/changed what, and when. */
@Controller()
export class EventController {
  private eventService = new CaremanagementEventService();

  @Get('/errands/:errandId/events')
  @OpenAPI({ summary: 'The who/what/when activity log (event log) for an errand' })
  @ResponseSchema(ErrandEventsApiResponse)
  @UseBefore(authMiddleware)
  async listEvents(
    @Param('errandId') errandId: string,
    @QueryParam('action') action?: string,
    @QueryParam('actor') actor?: string,
  ) {
    const res = await this.eventService.readEvents(errandId, { action, actor });
    return { data: res.data, message: 'success' };
  }
}
