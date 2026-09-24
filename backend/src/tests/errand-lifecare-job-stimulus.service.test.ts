import { LifecareJobStimulusRaw } from '@interfaces/lifecare-job-stimulus.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import ErrandLifecareJobStimulusService from '@services/errand-lifecare-job-stimulus.service';
import LifecareJobStimulusService from '@services/lifecare-job-stimulus.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const period = (jobStimulusId: number, fromDate: string, toDate: string, markedForRemoval = false) => ({
  jobStimulusId,
  personId: '19880209T050',
  fromDate,
  toDate,
  updateTimestamp: '2026-08-21',
  updateSignature: 'ebb14eri',
  markedForRemoval,
  personIdFormatted: '880209-T050',
});

// Calculation/GetJobStimulusForService?businessType=8&businessId=1 (capture 2026-09-24), with a medsökande added.
const raw: LifecareJobStimulusRaw = {
  applicant: {
    periods: [period(101, '2021-01-01', '2021-12-31'), period(103, '2026-01-01', '2027-12-31')],
    personId: '19880209T050',
    name: 'Testsson, Test',
    personIdFormatted: '880209-T050',
  },
  coApplicant: {
    periods: [period(201, '2026-03-01', ''), period(202, '2025-01-01', '2025-06-30', true)],
    personId: '19900101T001',
    name: 'Testsson, Medsökande',
    personIdFormatted: '900101-T001',
  },
  hasCoApplicant: true,
};

describe('ErrandLifecareJobStimulusService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
      data: { lifecareServiceId: 1 },
      message: 'success',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the periods from the insats in Lifecare, per person and without the personnummer', async () => {
    const read = vi.spyOn(LifecareJobStimulusService.prototype, 'readForService').mockResolvedValue(raw);
    const report = vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();

    const periods = await new ErrandLifecareJobStimulusService().periods('errand-1');

    expect(read).toHaveBeenCalledWith(1);
    expect(periods).toEqual([
      { id: 101, role: 'APPLICANT', fromDate: '2021-01-01', toDate: '2021-12-31' },
      { id: 103, role: 'APPLICANT', fromDate: '2026-01-01', toDate: '2027-12-31' },
      // An open period has no end; a period marked for removal is left out.
      { id: 201, role: 'CO_APPLICANT', fromDate: '2026-03-01', toDate: undefined },
    ]);
    expect(report.mock.calls[0]?.[1]).toMatchObject([{ action: 'READ', target: 'JOB_STIMULUS' }]);
  });

  it("adds a period with the end Lifecare's two-year rule gives, sending every existing period back", async () => {
    const soleApplicant = { ...raw, coApplicant: null, hasCoApplicant: false };
    vi.spyOn(LifecareJobStimulusService.prototype, 'readForService').mockResolvedValue(soleApplicant);
    const readToDate = vi.spyOn(LifecareJobStimulusService.prototype, 'readToDate').mockResolvedValue('2030-01-14');
    const save = vi.spyOn(LifecareJobStimulusService.prototype, 'save').mockResolvedValue(soleApplicant);
    const report = vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();

    await new ErrandLifecareJobStimulusService().addPeriod('errand-1', { fromDate: '2028-01-15' });

    expect(readToDate).toHaveBeenCalledWith('2028-01-15');
    const body = save.mock.calls[0]?.[0] as { applicant: { periods: { fromDate: string; toDate: string }[] } };
    expect(body.applicant.periods.map(sent => sent.fromDate)).toEqual(['2021-01-01', '2026-01-01', '2028-01-15']);
    expect(body.applicant.periods[2]?.toDate).toBe('2030-01-14');
    expect(report.mock.lastCall?.[1]).toMatchObject([{ action: 'CREATE', target: 'JOB_STIMULUS' }]);
  });

  it('refuses to change the periods of a household with a medsökande', async () => {
    vi.spyOn(LifecareJobStimulusService.prototype, 'readForService').mockResolvedValue(raw);
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
    const save = vi.spyOn(LifecareJobStimulusService.prototype, 'save');

    await expect(
      new ErrandLifecareJobStimulusService().addPeriod('errand-1', { fromDate: '2028-01-15', toDate: '2028-12-31' }),
    ).rejects.toMatchObject({ status: 422 });
    expect(save).not.toHaveBeenCalled();
  });

  it('has no periods for a household without any', async () => {
    vi.spyOn(LifecareJobStimulusService.prototype, 'readForService').mockResolvedValue({ applicant: null, coApplicant: null, hasCoApplicant: false });
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();

    expect(await new ErrandLifecareJobStimulusService().periods('errand-1')).toEqual([]);
  });
});
