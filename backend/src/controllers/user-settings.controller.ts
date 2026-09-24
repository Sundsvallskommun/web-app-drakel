import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementUserSettingsService from '@services/caremanagement-user-settings.service';
import { Body, Controller, Get, Put, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { UpdateUserSettingsDto } from '@/dtos/user-settings.dto';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { UserSettingsApiResponse } from '@/responses/user-settings.response';

/**
 * The signed-in handläggare's own settings. The AD account is the session's — never taken from the caller — so
 * a handläggare can only read and change their own.
 */
@Controller()
export class UserSettingsController {
  private settingsService = new CaremanagementUserSettingsService();

  @Get('/me/settings')
  @OpenAPI({ summary: "The signed-in handläggare's settings (careM's defaults until they save any)" })
  @ResponseSchema(UserSettingsApiResponse)
  @UseBefore(authMiddleware)
  async read(@Req() req: RequestWithUser) {
    return { data: await this.settingsService.read(req.user.username), message: 'success' };
  }

  @Put('/me/settings')
  @OpenAPI({ summary: "Saves the signed-in handläggare's settings" })
  @ResponseSchema(UserSettingsApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(UpdateUserSettingsDto, 'body'))
  async replace(@Req() req: RequestWithUser, @Body() settings: UpdateUserSettingsDto) {
    return { data: await this.settingsService.replace(req.user.username, settings), message: 'success' };
  }
}
