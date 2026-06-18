import authMiddleware from '@middlewares/auth.middleware';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementPaymentService from '@services/caremanagement-payment.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import { Controller, Get, Param, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { PaymentStatusApiResponse } from '@/responses/payment.response';

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

    const applicant = stakeholdersRes.data?.find((stakeholder) => stakeholder.role === APPLICANT_ROLE)?.externalId;
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
}
