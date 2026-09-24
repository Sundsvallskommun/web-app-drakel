import CaremanagementErrandService from '@services/caremanagement-errand.service';
import ErrandLifecarePaymentsService from '@services/errand-lifecare-payments.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import { logger } from '@utils/logger';

import { LifecareSectionStatusView } from '@/responses/lifecare-section-status.response';

/**
 * Which of the errand's Normberäkning, Beslut and Utbetalning are done, as Lifecare has them — the checks on
 * the tabs, in place of careM's section approvals. Normberäkning is done once its beräkning is slutlig, Beslut
 * once the beslut is saved in Lifecare, and Utbetalning once the utbetalning for the errand's month is
 * registered there. Each is read on its own: one Lifecare read failing leaves that check off, not the others.
 */
class ErrandLifecareSectionStatusService {
  private errandService = new CaremanagementErrandService();
  private calculations = new LifecareCalculationsService();
  private payments = new ErrandLifecarePaymentsService();
  private accessLog = new LifecareAccessLogService();

  async read(errandId: string): Promise<LifecareSectionStatusView> {
    const view = await this.errandService.getFinancialAssistanceView(errandId);
    const serviceId = view.data?.lifecareServiceId;
    const calculationId = view.data?.data?.lifecareCalculationId ?? undefined;
    const decisionId = view.data?.data?.lifecareDecisionId ?? undefined;

    const [calculationFinalized, paymentRegistered] = await Promise.all([
      typeof serviceId === 'number' && calculationId !== undefined
        ? this.calculationFinalized(errandId, serviceId, calculationId)
        : Promise.resolve(false),
      this.payments
        .paymentStatus(errandId)
        .then(status => status.effectuated)
        .catch(() => false),
    ]);
    return { calculationFinalized, decisionSaved: decisionId !== undefined, paymentRegistered };
  }

  /** Whether the errand's beräkning is slutlig, from the insats's list — one Lifecare read without any rows. */
  private async calculationFinalized(errandId: string, serviceId: number, calculationId: number): Promise<boolean> {
    try {
      const listed = await this.calculations.listForService(serviceId);
      await this.accessLog.logRead(errandId, { target: 'CALCULATION', description: 'Läste insatsens normberäkningar i Lifecare' });
      return listed.some(calculation => calculation.calculationId === calculationId && calculation.isFinalized);
    } catch {
      logger.warn(`Could not read whether the beräkning of errand ${errandId} is slutlig in Lifecare`);
      return false;
    }
  }
}

export default ErrandLifecareSectionStatusService;
