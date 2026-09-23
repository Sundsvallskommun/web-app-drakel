import { LifecareDecisionProposalRaw, LifecareSavedDecisionRaw } from '@interfaces/lifecare-decision.interface';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import LifecareDecisionsService from '@services/lifecare-decisions.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

const person = { personId: '19880209T050', name: 'Testsson, Test', coApplicant: false, personIdFormatted: '880209-T050' };

const proposal: LifecareDecisionProposalRaw = {
  decision: { decisionId: 0, date: '2026-09-23', decisionPersons: [person], sharedCustody: false },
  decisionMakers: [{ id: 'TEST', name: 'Test Handläggare', title: 'Testhandläggare' }],
  decisionTypes: [
    { code: 152, name: 'EK Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, avslag', type: 10, isActive: true, requiresFromDate: false, requiresToDate: false },
    { code: 153, name: 'Ek Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, bifall', type: 0, isActive: true, requiresFromDate: true, requiresToDate: true },
  ],
};

const saved: LifecareSavedDecisionRaw = {
  decisionId: 98,
  decisionCode: 153,
  decisionType: 0,
  date: '2026-09-23',
  fromDate: '2026-09-01',
  toDate: '2026-09-30',
  reasonCode: 19,
  reason: 'Arbetar deltid ofrivilligt, otillräcklig inkomst',
  decisionMaker: 'TEST',
  decisionMakerName: 'Test Handläggare',
  amount: 3000,
  decisionPersons: [person],
  type: { code: 153 },
  message: '<p>Beslut</p>',
  lockedMessage: false,
};

const bifall = {
  decisionCode: 153,
  periodFrom: '2026-09-01',
  periodTo: '2026-09-30',
  amount: 3000,
  reasonCode: 19,
  decisionMessage: '<p>Beslut</p>',
};

const withDecisionId = (lifecareDecisionId?: number) =>
  vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
    data: { lifecareServiceId: 1, data: { lifecareDecisionId } },
    message: 'success',
  });

describe('ErrandLifecareDecisionService', () => {
  beforeEach(() => {
    vi.spyOn(LifecareDecisionsService.prototype, 'readProposal').mockResolvedValue(proposal);
    vi.spyOn(LifecareDecisionsService.prototype, 'readReasons').mockResolvedValue([
      {
        header: 'Arbetar deltid, ofrivilligt',
        name: 'Arbetar deltid, ofrivilligt',
        reasonCode: null,
        options: [{ header: '', name: 'Arbetar deltid ofrivilligt, otillräcklig inkomst', reasonCode: 19, options: [] }],
      },
    ]);
    vi.spyOn(LifecareDecisionsService.prototype, 'readDecision').mockResolvedValue(saved);
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has no beslut to show before one is saved', async () => {
    withDecisionId(undefined);

    expect(await new ErrandLifecareDecisionService().read('errand-1')).toBeUndefined();
  });

  it('shows the saved beslut as Lifecare has it, without the personnummer', async () => {
    withDecisionId(98);

    const view = await new ErrandLifecareDecisionService().read('errand-1');

    expect(view).toEqual({
      id: 98,
      decisionCode: 153,
      outcome: 'BIFALL',
      date: '2026-09-23',
      periodFrom: '2026-09-01',
      periodTo: '2026-09-30',
      amount: 3000,
      reasonCode: 19,
      reason: 'Arbetar deltid ofrivilligt, otillräcklig inkomst',
      message: '<p>Beslut</p>',
      locked: false,
      decisionMaker: 'Test Handläggare',
    });
  });

  it('creates the beslut the first time and points the errand at it', async () => {
    withDecisionId(undefined);
    const create = vi.spyOn(LifecareDecisionsService.prototype, 'create').mockResolvedValue({ decisionId: 98 });
    const update = vi.spyOn(LifecareDecisionsService.prototype, 'update');
    const link = vi.spyOn(CaremanagementErrandService.prototype, 'setLifecareDecisionId').mockResolvedValue();

    const view = await new ErrandLifecareDecisionService().save('errand-1', bifall, 'test');

    expect(create.mock.calls[0]?.[1]).toMatchObject({ decisionCode: 153, reasonCode: 19, amount: 3000, decisionMaker: 'TEST' });
    expect(update).not.toHaveBeenCalled();
    expect(link).toHaveBeenCalledWith('errand-1', 98);
    expect(view.id).toBe(98);
  });

  it('changes the same beslut every time after, never making a second one', async () => {
    withDecisionId(98);
    const create = vi.spyOn(LifecareDecisionsService.prototype, 'create');
    const update = vi.spyOn(LifecareDecisionsService.prototype, 'update').mockResolvedValue({ ...saved, message: '<p>Ändrat</p>' });

    const view = await new ErrandLifecareDecisionService().save('errand-1', { ...bifall, decisionMessage: '<p>Ändrat</p>' }, 'test');

    expect(create).not.toHaveBeenCalled();
    expect(update.mock.calls[0]?.[0]).toBe(98);
    expect(update.mock.calls[0]?.[1]).toMatchObject({ decisionId: 98, message: '<p>Ändrat</p>' });
    expect(view.message).toBe('<p>Ändrat</p>');
  });

  it('lists the beslutstyper the insats offers in Lifecare, marking the ones Drakel registers', async () => {
    withDecisionId(undefined);
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
      data: { lifecareServiceId: 1 },
      message: 'success',
    });
    vi.spyOn(LifecareDecisionsService.prototype, 'readProposal').mockResolvedValue({
      ...proposal,
      decisionTypes: [
        ...proposal.decisionTypes,
        { code: 161, name: 'EK Återkrav', type: 9, isActive: true, requiresFromDate: false, requiresToDate: false },
        { code: 9, name: 'Utgången', type: 9, isActive: false, requiresFromDate: false, requiresToDate: false },
      ],
    });

    const types = await new ErrandLifecareDecisionService().types('errand-1');

    expect(types.map(type => [type.code, type.outcome])).toEqual([
      [152, 'AVSLAG'],
      [153, 'BIFALL'],
      [161, undefined],
    ]);
  });

  it('lists the orsaker of a beslutstyp under the heading each sits in', async () => {
    expect(await new ErrandLifecareDecisionService().reasons(153)).toEqual([
      { code: 19, name: 'Arbetar deltid ofrivilligt, otillräcklig inkomst', header: 'Arbetar deltid, ofrivilligt' },
    ]);
  });

  it('hands back why a beslut cannot be saved, e.g. a beslutstyp Drakel does not register', async () => {
    withDecisionId(undefined);
    vi.spyOn(LifecareDecisionsService.prototype, 'readProposal').mockResolvedValue({
      ...proposal,
      decisionTypes: [{ code: 161, name: 'EK Återkrav', type: 9, isActive: true, requiresFromDate: false, requiresToDate: false }],
    });
    const create = vi.spyOn(LifecareDecisionsService.prototype, 'create');

    await expect(new ErrandLifecareDecisionService().save('errand-1', { ...bifall, decisionCode: 161 }, 'test')).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('EK Återkrav') as string,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('warns against saving again when the beslut was made but the errand could not be pointed at it', async () => {
    withDecisionId(undefined);
    vi.spyOn(LifecareDecisionsService.prototype, 'create').mockResolvedValue({ decisionId: 98 });
    vi.spyOn(CaremanagementErrandService.prototype, 'setLifecareDecisionId').mockRejectedValue(new HttpException(503, 'careM is down'));

    await expect(new ErrandLifecareDecisionService().save('errand-1', bifall, 'test')).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining('Spara inte igen') as string,
    });
  });

  it('links careM’s finalized decision to the Lifecare beslut', async () => {
    const report = vi.spyOn(CaremanagementDecisionService.prototype, 'reportLifecareResult').mockResolvedValue({ data: null, message: 'success' });

    const registration = await new ErrandLifecareDecisionService().receiptFinalized('errand-1', 'decision-1', 98);

    expect(report).toHaveBeenCalledWith('errand-1', 'decision-1', { outcome: 'WRITTEN', lifecareId: '98' });
    expect(registration).toEqual({ decisionId: 'decision-1', outcome: 'REGISTERED', lifecareId: '98' });
  });

  it('has no PDF to give before a beslut is saved', async () => {
    withDecisionId(undefined);

    await expect(new ErrandLifecareDecisionService().pdf('errand-1')).rejects.toMatchObject({ status: 404 });
  });
});
