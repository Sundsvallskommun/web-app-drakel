import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import { pickPreviousCalculation } from '@utils/previous-calculation';

import { PreviousCalculationView, toPreviousCalculationView } from '@/responses/previous-calculation.response';

/**
 * The beräkning preceding the errand's own period, read from Lifecare — the "Jämför med föregående månad" view.
 * Which one it is comes from the insats's list of beräkningar (`Calculation/ListCalculations`); its rows and
 * sums from `Calculation/GetCalculation`. The errand's own period is its saved beräkning's, or — before that —
 * careM's draft's.
 */
class ErrandPreviousCalculationService {
  private errandService = new CaremanagementErrandService();
  private normberakning = new CaremanagementNormberakningService();
  private calculations = new LifecareCalculationsService();
  private accessLog = new LifecareAccessLogService();

  /** The previous beräkning, or null when the insats has none before the errand's period. */
  async read(errandId: string): Promise<PreviousCalculationView | null> {
    const view = await this.errandService.getFinancialAssistanceView(errandId);
    const serviceId = view.data?.lifecareServiceId;
    if (typeof serviceId !== 'number') {
      return null;
    }
    const ownCalculationId = view.data?.data?.lifecareCalculationId ?? undefined;

    const listed = await this.calculations.listForService(serviceId);
    await this.accessLog.logRead(errandId, { target: 'CALCULATION', description: 'Läste insatsens normberäkningar i Lifecare' });
    const own = listed.find(calculation => calculation.calculationId === ownCalculationId);
    const periodStart = own?.startDate ?? (await this.normberakning.readPeriodStart(errandId).catch(() => undefined));
    const previous = pickPreviousCalculation(listed, periodStart, ownCalculationId);
    if (!previous) {
      return null;
    }

    const calculation = await this.calculations.read(previous.calculationId);
    await this.accessLog.logRead(errandId, {
      target: 'CALCULATION',
      description: 'Läste föregående normberäkning i Lifecare',
      lifecareId: String(previous.calculationId),
    });
    return toPreviousCalculationView(calculation);
  }
}

export default ErrandPreviousCalculationService;
