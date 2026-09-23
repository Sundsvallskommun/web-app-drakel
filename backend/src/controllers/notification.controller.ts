import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementNotificationService from '@services/caremanagement-notification.service';
import { Body, Controller, Get, OnUndefined, Param, Patch, Put, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { UpdateNotificationDto } from '@/dtos/notification.dto';
import { ErrandNotificationApiResponse, ErrandNotificationsApiResponse } from '@/responses/notification.response';

/**
 * Exposes the handläggare's notifications (e.g. new messages from applicants) and the two states they
 * move through: acknowledged, meaning it has been seen, and handled, meaning it has been acted on.
 */
@Controller()
export class NotificationController {
  private notificationService = new CaremanagementNotificationService();

  @Get('/notifications')
  @OpenAPI({ summary: "The current handläggare's notifications across all their errands" })
  @ResponseSchema(ErrandNotificationsApiResponse)
  @UseBefore(authMiddleware)
  async listNotifications(@Req() req: RequestWithUser) {
    const res = await this.notificationService.readNotifications(req.user.username);
    return { data: res.data, message: 'success' };
  }

  @Patch('/errands/:errandId/notifications/:notificationId')
  @OpenAPI({ summary: 'Mark a notification read or handled, or withdraw either' })
  @ResponseSchema(ErrandNotificationApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(UpdateNotificationDto, 'body'))
  async updateNotification(
    @Param('errandId') errandId: string,
    @Param('notificationId') notificationId: string,
    @Body() input: UpdateNotificationDto,
  ) {
    const res = await this.notificationService.updateNotification(errandId, notificationId, {
      acknowledged: input.acknowledged,
      handled: input.handled,
    });
    return { data: res.data, message: 'success' };
  }

  /**
   * Nothing in Draken calls this yet — the notification list marks one at a time. It mirrors
   * caremanagement's bulk endpoint so a "markera alla som hanterade" action has somewhere to go.
   */
  @Put('/errands/:errandId/notifications/handled')
  @OpenAPI({ summary: 'Mark every notification on an errand as handled' })
  @OnUndefined(204)
  @UseBefore(authMiddleware)
  async markAllHandled(@Param('errandId') errandId: string) {
    await this.notificationService.markAllHandled(errandId);
  }
}
