import authMiddleware from '@middlewares/auth.middleware';
import DecisionNotificationService from '@services/decision-notification.service';
import { Controller, Get, Param, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { DigitalMailboxApiResponse } from '@/responses/digital-mailbox.response';

/**
 * Reports whether the applicant has a digital mailbox, so the "Besluta och utbetala" dialog can offer that
 * channel. The beslut itself is sent as part of finalize (see FinalizeController).
 */
@Controller()
export class DecisionNotificationController {
  private notificationService = new DecisionNotificationService();

  @Get('/errands/:errandId/digital-mailbox')
  @OpenAPI({ summary: 'Whether the applicant has a reachable digital mailbox' })
  @ResponseSchema(DigitalMailboxApiResponse)
  @UseBefore(authMiddleware)
  async digitalMailbox(@Param('errandId') errandId: string) {
    try {
      const available = await this.notificationService.hasDigitalMailbox(errandId);
      return { data: { available }, message: 'success' };
    } catch {
      // A failing mailbox lookup must not block the flow — just don't offer the digital-brevlåda channel.
      return { data: { available: false }, message: 'mailbox lookup failed' };
    }
  }
}
