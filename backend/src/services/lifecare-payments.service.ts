import {
  LifecareCreatedPaymentRaw,
  LifecarePayeeRaw,
  LifecarePaymentForCreateRaw,
  LifecareRegisteredPaymentRaw,
} from '@interfaces/lifecare-payment.interface';

import LifecareApiService from './lifecare-api.service';

const PROFESSIONAL_WEB = 'WESE.FC.ProfessionalWeb';

// Lifecare's businessType for "businessId is an insats" — the same code its decision and job stimulus
// endpoints take.
const SERVICE_BUSINESS_TYPE = '8';

/**
 * Lifecare's utbetalning endpoints: the underlag for a new payment on an insats, and creating a
 * betalningsmottagare. The paths are copied from captures of Lifecare's own web app, down to the
 * missing trailing slash on `Payee/Create` — its paths are not consistent, and correcting them breaks
 * them.
 */
class LifecarePaymentsService {
  private readonly apiService = new LifecareApiService();

  /** The underlag for a new utbetalning on the insats: blank payment, payees, betalsätt, saldon. */
  public async readPaymentForCreate(serviceId: number): Promise<LifecarePaymentForCreateRaw> {
    const res = await this.apiService.get<LifecarePaymentForCreateRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Payment/GetPaymentForCreate',
      params: { businessType: SERVICE_BUSINESS_TYPE, businessId: String(serviceId) },
    });
    return res.data;
  }

  /**
   * Creates a betalningsmottagare. Not idempotent — Lifecare has no key to recognise a repeated call,
   * so a second call creates a second payee. Callers check the existing payees first.
   */
  public async createPayee(payee: LifecarePayeeRaw): Promise<LifecarePayeeRaw> {
    const res = await this.apiService.post<LifecarePayeeRaw>({ module: PROFESSIONAL_WEB, path: 'api2/Payee/Create' }, payee);
    return res.data;
  }

  /**
   * Whether the person has a hushåll in Lifecare on the given date — the check Lifecare's web app makes
   * before it saves an utbetalning. The personnummer goes in the query string because that is where
   * Lifecare reads it.
   */
  public async hasHouseholdOn(personId: string, date: string): Promise<boolean> {
    const res = await this.apiService.get<boolean>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Household/HasHouseholdThisDate/',
      params: { personId, date },
    });
    return res.data;
  }

  /**
   * The latest utbetalningar registered on the insats. "Latest" is Lifecare's own word, so the list may not
   * reach far back — enough to recognise an utbetalning that was just made.
   */
  public async readLatestPayments(serviceId: number): Promise<LifecareRegisteredPaymentRaw[]> {
    const res = await this.apiService.get<LifecareRegisteredPaymentRaw[]>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Payment/GetLatestPayments',
      params: { businessType: SERVICE_BUSINESS_TYPE, businessId: String(serviceId) },
    });
    return res.data;
  }

  /**
   * Registers an utbetalning on the insats. Not idempotent and it moves money: a second call pays twice.
   * The body is the underlag's own payment object, filled in — see buildPaymentCreate.
   */
  public async createPayment(serviceId: number, payment: Record<string, unknown>): Promise<LifecareCreatedPaymentRaw> {
    const res = await this.apiService.post<LifecareCreatedPaymentRaw>(
      {
        module: PROFESSIONAL_WEB,
        path: 'api2/Payment/Create',
        params: { businessType: SERVICE_BUSINESS_TYPE, businessId: String(serviceId) },
      },
      payment,
    );
    return res.data;
  }
}

export default LifecarePaymentsService;
