import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandLifecarePaymentsService from '@services/errand-lifecare-payments.service';
import { Body, Controller, Get, HttpCode, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { CreateLifecarePayeeDto } from '@/dtos/lifecare-payee.dto';
import { LifecarePayeeApiResponse, LifecarePaymentOptionsApiResponse } from '@/responses/lifecare-payment-options.response';

/**
 * The betalsätt and betalningsmottagare an utbetalning on the errand can use, read from and written to
 * Lifecare — the register of record for both.
 */
@Controller()
export class LifecarePaymentsController {
  private paymentsService = new ErrandLifecarePaymentsService();

  @Get('/errands/:errandId/lifecare-payment-options')
  @OpenAPI({ summary: "The betalsätt and betalningsmottagare on the errand's insats, read from Lifecare" })
  @ResponseSchema(LifecarePaymentOptionsApiResponse)
  @UseBefore(authMiddleware)
  async paymentOptions(@Param('errandId') errandId: string) {
    return { data: await this.paymentsService.paymentOptions(errandId), message: 'success' };
  }

  @Post('/errands/:errandId/lifecare-payees')
  @HttpCode(201)
  @OpenAPI({ summary: 'Add a betalningsmottagare in Lifecare (an identical existing one is returned instead)' })
  @ResponseSchema(LifecarePayeeApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(CreateLifecarePayeeDto, 'body'))
  async createPayee(@Param('errandId') errandId: string, @Body() input: CreateLifecarePayeeDto) {
    return { data: await this.paymentsService.createPayee(errandId, input), message: 'success' };
  }
}
