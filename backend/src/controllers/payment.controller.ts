import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementPaymentService from '@services/caremanagement-payment.service';
import LifecarePaymentRegistrationService from '@services/lifecare-payment-registration.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { Body, Controller, Get, HttpCode, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { PaymentInputDto } from '@/dtos/payment.dto';
import { PaymentRegistrationApiResponse } from '@/responses/payment-registration.response';
import { PaymentApiResponse, PaymentsApiResponse } from '@/responses/payment-resource.response';

/**
 * careM's utbetalning rows on an errand — the handläggare's drafts and the ones finalize created — and
 * registering one that waits for Lifecare. Everything else about utbetalning is read from Lifecare.
 */
@Controller()
export class PaymentController {
  private paymentService = new CaremanagementPaymentService();
  private paymentRegistration = new LifecarePaymentRegistrationService();
  private serviceIds = new LifecareServiceIdService();

  @Get('/errands/:errandId/payments')
  @OpenAPI({ summary: 'List the utbetalningar on an errand (both handläggare drafts and finalize-created rows)' })
  @ResponseSchema(PaymentsApiResponse)
  @UseBefore(authMiddleware)
  async listPayments(@Param('errandId') errandId: string) {
    const res = await this.paymentService.listPayments(errandId);
    return { data: res.data ?? [], message: 'success' };
  }

  @Post('/errands/:errandId/payments')
  @HttpCode(201)
  @OpenAPI({ summary: 'Register an utbetalning on an errand (stored as DRAFT; queues no RPA task)' })
  @ResponseSchema(PaymentApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(PaymentInputDto, 'body'))
  async createPayment(@Param('errandId') errandId: string, @Body() input: PaymentInputDto) {
    const res = await this.paymentService.createPayment(errandId, input);
    return { data: res.data ?? null, message: 'success' };
  }

  @Post('/errands/:errandId/payments/:paymentId/lifecare-registration')
  @OpenAPI({
    summary: 'Register an utbetalning waiting for Lifecare (PENDING_REGISTRATION) there, and receipt it to careM',
  })
  @ResponseSchema(PaymentRegistrationApiResponse)
  @UseBefore(authMiddleware)
  async registerInLifecare(@Param('errandId') errandId: string, @Param('paymentId') paymentId: string) {
    const serviceId = await this.serviceIds.resolve(errandId);
    return { data: await this.paymentRegistration.register(errandId, serviceId, paymentId), message: 'success' };
  }
}
