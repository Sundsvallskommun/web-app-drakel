import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementMetadataService from '@services/caremanagement-metadata.service';
import CaremanagementPaymentService from '@services/caremanagement-payment.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import { toDropdownOption } from '@utils/dropdown-option';
import { Body, Controller, Get, HttpCode, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { PaymentInputDto } from '@/dtos/payment.dto';
import { PaymentStatusApiResponse } from '@/responses/payment.response';
import { PaymentProposalApiResponse } from '@/responses/payment-proposal.response';
import { PaymentApiResponse, PaymentMetadataApiResponse, PaymentsApiResponse } from '@/responses/payment-resource.response';

// The applicant whose Lifecare utbetalning the payment status concerns.
const APPLICANT_ROLE = 'APPLICANT';

/** Builds the ISO year-month (yyyy-MM) the payment-status endpoint expects from the FA period. */
const toApplicationMonth = (month?: number, year?: number): string | undefined =>
  month && year ? `${year}-${String(month).padStart(2, '0')}` : undefined;

/** Owns the utbetalning (payment) status of a financial-assistance errand. */
@Controller()
export class PaymentController {
  private paymentService = new CaremanagementPaymentService();
  private errandService = new CaremanagementErrandService();
  private stakeholderService = new CaremanagementStakeholderService();
  private metadataService = new CaremanagementMetadataService();

  @Get('/errands/:errandId/payment-status')
  @OpenAPI({ summary: 'Whether the Lifecare utbetalning for the application month has been effectuated' })
  @ResponseSchema(PaymentStatusApiResponse)
  @UseBefore(authMiddleware)
  async getPaymentStatus(@Param('errandId') errandId: string) {
    // The applicant (partyId) and application month both come from the errand: the APPLICANT
    // stakeholder's externalId and the financial-assistance period.
    const [stakeholdersRes, viewRes] = await Promise.all([
      this.stakeholderService.readStakeholders(errandId),
      this.errandService.getFinancialAssistanceView(errandId),
    ]);

    const applicant = stakeholdersRes.data?.find(stakeholder => stakeholder.role === APPLICANT_ROLE)?.externalId;
    const applicationMonth = toApplicationMonth(viewRes.data?.data?.periodMonth, viewRes.data?.data?.periodYear);

    if (!applicant || !applicationMonth) {
      return { data: { applicationMonth, effectuated: false, unavailable: true }, message: 'success' };
    }

    try {
      const res = await this.paymentService.readPaymentStatus(applicant, applicationMonth);
      return {
        data: {
          applicationMonth,
          effectuated: res.data?.effectuated ?? false,
          paymentDate: res.data?.paymentDate,
          unavailable: false,
        },
        message: 'success',
      };
    } catch {
      // A Lifecare FC outage (e.g. 502) is a normal operational state for a status read — surface it
      // as "unavailable" rather than failing the whole request.
      return { data: { applicationMonth, effectuated: false, unavailable: true }, message: 'success' };
    }
  }

  @Get('/errands/:errandId/payment-proposal')
  @OpenAPI({ summary: 'The utbetalningsförslag for an errand (proposed date, amount and payee, plus payee options)' })
  @ResponseSchema(PaymentProposalApiResponse)
  @UseBefore(authMiddleware)
  async getPaymentProposal(@Param('errandId') errandId: string) {
    const res = await this.paymentService.readPaymentProposal(errandId);
    return { data: res.data, message: 'success' };
  }

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

  @Get('/payment-metadata')
  @OpenAPI({ summary: 'The Lifecare payment methods for the utbetalning betalsätt dropdown' })
  @ResponseSchema(PaymentMetadataApiResponse)
  @UseBefore(authMiddleware)
  async getPaymentMetadata() {
    const res = await this.metadataService.readFinancialAssistanceMetadata();
    return {
      data: {
        paymentMethods: (res.data?.paymentMethods ?? []).map(toDropdownOption),
      },
      message: 'success',
    };
  }
}
