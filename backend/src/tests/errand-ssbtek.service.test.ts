import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementSsbtekService from '@services/caremanagement-ssbtek.service';
import ErrandSsbtekService from '@services/errand-ssbtek.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

const PERIOD = { from: '2026-07-01', to: '2026-09-30' };

const answer = (benefit: string) => ({
  data: {
    ...PERIOD,
    agencies: {
      fk: {
        formansinformation: {
          utbetalningsuppgift: [{ formansfamilj: { beskrivning: benefit }, datum: '2026-09-25', nettobelopp: { summa: 100 } }],
        },
      },
    },
  },
  message: 'success',
});

/** The ansökan's children, as careM's financial-assistance view gives them. */
const withChildren = (children: { partyId?: string; firstName?: string; lastName?: string }[]) =>
  vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
    data: { data: { children } },
    message: 'success',
  });

describe('ErrandSsbtekService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getErrandByIdentifier').mockResolvedValue({
      data: { id: 'errand-uuid', errandNumber: 'EB-26090036' },
      message: 'success',
    });
    withChildren([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the sökandes and the medsökandes SSBTEK basis for the errand behind the route segment', async () => {
    const readBasis = vi
      .spyOn(CaremanagementSsbtekService.prototype, 'readBasis')
      .mockImplementation((_errandId, person) => Promise.resolve(answer(person === 'APPLICANT' ? 'Bostadsbidrag' : 'Sjukpenning')));

    const view = await new ErrandSsbtekService().readPayments('EB-26090036', PERIOD);

    expect(readBasis).toHaveBeenCalledWith('errand-uuid', 'APPLICANT', PERIOD);
    expect(readBasis).toHaveBeenCalledWith('errand-uuid', 'CO_APPLICANT', PERIOD);
    expect(view.hasCoApplicant).toBe(true);
    expect(view.payments.map(payment => [payment.person, payment.benefit])).toEqual([
      ['APPLICANT', 'Bostadsbidrag'],
      ['CO_APPLICANT', 'Sjukpenning'],
    ]);
  });

  it("takes careM's 404 for the medsökande to mean the errand has none", async () => {
    vi.spyOn(CaremanagementSsbtekService.prototype, 'readBasis').mockImplementation((_errandId, person) =>
      person === 'APPLICANT' ? Promise.resolve(answer('Bostadsbidrag')) : Promise.reject(new HttpException(404, 'Not found')),
    );

    const view = await new ErrandSsbtekService().readPayments('EB-26090036', PERIOD);

    expect(view).toMatchObject({ hasCoApplicant: false, coApplicantUnavailable: false });
    expect(view.payments).toHaveLength(1);
  });

  it('still lists the sökandes payments when SSBTEK cannot be read for the medsökande', async () => {
    vi.spyOn(CaremanagementSsbtekService.prototype, 'readBasis').mockImplementation((_errandId, person) =>
      person === 'APPLICANT' ? Promise.resolve(answer('Bostadsbidrag')) : Promise.reject(new HttpException(502, 'SSBTEK svarade inte')),
    );

    const view = await new ErrandSsbtekService().readPayments('EB-26090036', PERIOD);

    expect(view).toMatchObject({ hasCoApplicant: true, coApplicantUnavailable: true });
    expect(view.payments.map(payment => payment.person)).toEqual(['APPLICANT']);
  });

  it("passes on careM's refusal for the sökande", async () => {
    vi.spyOn(CaremanagementSsbtekService.prototype, 'readBasis').mockImplementation((_errandId, person) =>
      person === 'APPLICANT' ? Promise.reject(new HttpException(502, 'SSBTEK svarade inte')) : Promise.reject(new HttpException(404, 'Not found')),
    );

    await expect(new ErrandSsbtekService().readPayments('EB-26090036', PERIOD)).rejects.toThrow('SSBTEK svarade inte');
  });
  it("reads each child the ansökan names by its partyId, and tags their payments with the child's name", async () => {
    withChildren([
      { partyId: 'child-1', firstName: 'Alva', lastName: 'Testsson' },
      { firstName: 'Utan', lastName: 'PartyId' },
    ]);
    const readBasis = vi
      .spyOn(CaremanagementSsbtekService.prototype, 'readBasis')
      .mockImplementation((_errandId, person) =>
        person === 'CO_APPLICANT'
          ? Promise.reject(new HttpException(404, 'Not found'))
          : Promise.resolve(answer(person === 'CHILD' ? 'Underhållsstöd' : 'Bostadsbidrag')),
      );

    const view = await new ErrandSsbtekService().readPayments('EB-26090036', PERIOD);

    expect(readBasis).toHaveBeenCalledWith('errand-uuid', 'CHILD', PERIOD, 'child-1');
    expect(readBasis).toHaveBeenCalledTimes(3);
    expect(view).toMatchObject({ hasChildren: true, unavailableChildren: [] });
    expect(view.payments.map(payment => [payment.person, payment.childName, payment.benefit])).toEqual([
      ['APPLICANT', undefined, 'Bostadsbidrag'],
      ['CHILD', 'Alva Testsson', 'Underhållsstöd'],
    ]);
  });

  it('names the children SSBTEK could not be read for, and still lists the rest', async () => {
    withChildren([{ partyId: 'child-1', firstName: 'Alva', lastName: 'Testsson' }]);
    vi.spyOn(CaremanagementSsbtekService.prototype, 'readBasis').mockImplementation((_errandId, person) =>
      person === 'APPLICANT' ? Promise.resolve(answer('Bostadsbidrag')) : Promise.reject(new HttpException(502, 'SSBTEK svarade inte')),
    );

    const view = await new ErrandSsbtekService().readPayments('EB-26090036', PERIOD);

    expect(view).toMatchObject({ hasChildren: true, unavailableChildren: ['Alva Testsson'] });
    expect(view.payments.map(payment => payment.person)).toEqual(['APPLICANT']);
  });
});
