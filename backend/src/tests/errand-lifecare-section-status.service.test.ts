import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import ErrandLifecarePaymentsService from '@services/errand-lifecare-payments.service';
import ErrandLifecareSectionStatusService from '@services/errand-lifecare-section-status.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

const withErrandData = (data: { lifecareCalculationId?: number; lifecareDecisionId?: number }) =>
  vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
    data: { lifecareServiceId: 1, data },
    message: 'success',
  });

describe('ErrandLifecareSectionStatusService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
    vi.spyOn(LifecareCalculationsService.prototype, 'listForService').mockResolvedValue([
      { calculationId: 31, date: '2026-09-24', startDate: '2026-09-01', endDate: '2026-09-30', isFinalized: true },
      { calculationId: 29, date: '2026-09-23', startDate: '2026-12-01', endDate: '2026-12-31', isFinalized: false },
    ]);
    vi.spyOn(ErrandLifecarePaymentsService.prototype, 'paymentStatus').mockResolvedValue({ effectuated: true, unavailable: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checks each section by its state in Lifecare', async () => {
    withErrandData({ lifecareCalculationId: 31, lifecareDecisionId: 98 });

    expect(await new ErrandLifecareSectionStatusService().read('errand-1')).toEqual({
      calculationFinalized: true,
      decisionSaved: true,
      paymentRegistered: true,
    });
  });

  it('leaves a beräkning still being worked on, and a beslut not yet saved, unchecked', async () => {
    withErrandData({ lifecareCalculationId: 29 });

    expect(await new ErrandLifecareSectionStatusService().read('errand-1')).toMatchObject({
      calculationFinalized: false,
      decisionSaved: false,
    });
  });

  it('leaves a check off when Lifecare cannot be read, without failing the others', async () => {
    withErrandData({ lifecareCalculationId: 31, lifecareDecisionId: 98 });
    vi.spyOn(LifecareCalculationsService.prototype, 'listForService').mockRejectedValue(new HttpException(502, 'Lifecare down'));

    expect(await new ErrandLifecareSectionStatusService().read('errand-1')).toEqual({
      calculationFinalized: false,
      decisionSaved: true,
      paymentRegistered: true,
    });
  });
});
