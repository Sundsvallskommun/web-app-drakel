import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandLifecareRemindersService from '@services/errand-lifecare-reminders.service';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { CreateLifecareReminderDto } from '@/dtos/lifecare-reminder.dto';
import { LifecareReminderOptionsApiResponse, LifecareRemindersApiResponse } from '@/responses/lifecare-reminder.response';

/** The bevakningar on the errand's insats, read from and written to Lifecare — the register of record. */
@Controller()
export class LifecareRemindersController {
  private remindersService = new ErrandLifecareRemindersService();

  @Get('/errands/:errandId/lifecare-reminders')
  @OpenAPI({ summary: "The bevakningar on the errand's insats, read from Lifecare" })
  @ResponseSchema(LifecareRemindersApiResponse)
  @UseBefore(authMiddleware)
  async list(@Param('errandId') errandId: string) {
    return { data: await this.remindersService.list(errandId), message: 'success' };
  }

  @Get('/errands/:errandId/lifecare-reminders/options')
  @OpenAPI({ summary: 'The priorities and statuses a bevakning can have, as Lifecare lists them' })
  @ResponseSchema(LifecareReminderOptionsApiResponse)
  @UseBefore(authMiddleware)
  async options(@Param('errandId') errandId: string) {
    return { data: await this.remindersService.options(errandId), message: 'success' };
  }

  @Post('/errands/:errandId/lifecare-reminders')
  @HttpCode(201)
  @OpenAPI({ summary: "Add a bevakning on the errand's insats in Lifecare" })
  @UseBefore(authMiddleware, validationMiddleware(CreateLifecareReminderDto, 'body'))
  async create(@Param('errandId') errandId: string, @Body() input: CreateLifecareReminderDto) {
    await this.remindersService.create(errandId, input);
    return { data: null, message: 'success' };
  }

  @Put('/errands/:errandId/lifecare-reminders/:reminderId')
  @OpenAPI({ summary: "Change a bevakning on the errand's insats in Lifecare (also how it is marked done)" })
  @UseBefore(authMiddleware, validationMiddleware(CreateLifecareReminderDto, 'body'))
  async update(@Param('errandId') errandId: string, @Param('reminderId') reminderId: string, @Body() input: CreateLifecareReminderDto) {
    await this.remindersService.update(errandId, Number(reminderId), input);
    return { data: null, message: 'success' };
  }

  @Delete('/errands/:errandId/lifecare-reminders/:reminderId')
  @OpenAPI({ summary: "Remove a bevakning from the errand's insats in Lifecare" })
  @UseBefore(authMiddleware)
  async remove(@Param('errandId') errandId: string, @Param('reminderId') reminderId: string) {
    await this.remindersService.remove(errandId, Number(reminderId));
    return { data: null, message: 'success' };
  }
}
