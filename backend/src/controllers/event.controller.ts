import authMiddleware from '@middlewares/auth.middleware';
import { requirePermission } from '@middlewares/permission.middleware';
import CaremanagementEventService from '@services/caremanagement-event.service';
import { Controller, Get, Param, QueryParam, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { ActorEventLogApiResponse, ErrandEventsApiResponse } from '@/responses/event.response';

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
    @QueryParam('source') source?: string,
  ) {
    const res = await this.eventService.readEvents(errandId, { action, actor, source });
    return { data: res.data, message: 'success' };
  }

  /**
   * Logguppföljning: one handläggare's activity across every errand. Reading who looked at which errands
   * is a supervisory question rather than part of handläggning, so it takes the /admin permission.
   *
   * Not named "event-log": ad blockers' tracking lists (EasyPrivacy's `/event-log?`) block any request
   * whose URL contains it, so the search never reached the BFF in a browser with one installed.
   */
  @Get('/admin/actor-activity')
  @OpenAPI({ summary: 'One actor’s activity across every errand, newest first' })
  @ResponseSchema(ActorEventLogApiResponse)
  @UseBefore(authMiddleware, requirePermission('canViewEventLog'))
  async listActorEvents(
    @QueryParam('actor', { required: true }) actor: string,
    @QueryParam('action') action?: string,
    @QueryParam('source') source?: string,
    @QueryParam('from') from?: string,
    @QueryParam('to') to?: string,
  ) {
    const res = await this.eventService.readActorEvents(actor, { action, source, from, to });
    return { data: { events: res.data?.events ?? [], total: res.data?.total ?? 0 }, message: 'success' };
  }
}
