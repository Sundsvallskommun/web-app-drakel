import { LifecareDecisionProposalRaw, LifecareDecisionReasonRaw } from '@interfaces/lifecare-decision.interface';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import LifecareDecisionRegistrationService from '@services/lifecare-decision-registration.service';
import LifecareDecisionsService from '@services/lifecare-decisions.service';
import { findReasonCode } from '@utils/lifecare-decision';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FinalizeDecision, FinalizeDecisionOutcomeEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

/** Decision/GetMappedDecisionReasons?id=153 (capture 2026-09-23), trimmed to two headings. */
const catalogue: LifecareDecisionReasonRaw[] = [
  {
    header: 'Föräldraledig',
    name: 'Föräldraledig',
    reasonCode: null,
    options: [
      { header: 'Föräldraledig', name: 'Föräldrapenning otillräcklig', reasonCode: 16, options: [] },
      { header: 'Föräldraledig', name: 'Föräldrapenning, väntar på', reasonCode: 17, options: [] },
    ],
  },
  {
    header: 'Utan försörjningshinder',
    name: 'Utan försörjningshinder',
    reasonCode: null,
    options: [{ header: 'Utan försörjningshinder', name: 'Utan försörjningshinder', reasonCode: 23, options: [] }],
  },
];

const proposal: LifecareDecisionProposalRaw = {
  decision: {
    decisionId: 0,
    serviceId: 2,
    decisionPersons: [{ personId: '199001122390', name: 'Jeppson, Test', coApplicant: false, included: false, personIdFormatted: '900112-2390' }],
  },
  decisionMakers: [{ id: 'TEST', name: 'Test Handläggare', title: 'Testhandläggare' }],
  decisionTypes: [
    { code: 152, name: 'EK Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, avslag', isActive: true, requiresFromDate: false, requiresToDate: false },
    { code: 153, name: 'Ek Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, bifall', isActive: true, requiresFromDate: true, requiresToDate: true },
  ],
};

const bifall: FinalizeDecision = {
  outcome: FinalizeDecisionOutcomeEnum.BIFALL,
  reason: 'Föräldrapenning otillräcklig',
  periodFrom: '2026-09-01',
  periodTo: '2026-09-30',
  amount: 5,
  decisionMessage: '<p>Du beviljas bistånd</p>',
};

describe('findReasonCode', () => {
  it('finds a leaf of the catalogue by its wording, never a heading', () => {
    expect(findReasonCode(catalogue, 'Föräldrapenning otillräcklig')).toBe(16);
    expect(findReasonCode(catalogue, 'utan försörjningshinder')).toBe(23);
    expect(findReasonCode(catalogue, 'Föräldraledig')).toBeUndefined();
  });
});

describe('LifecareDecisionRegistrationService', () => {
  let report: ReturnType<typeof vi.spyOn<CaremanagementDecisionService, 'reportLifecareResult'>>;

  beforeEach(() => {
    vi.spyOn(LifecareDecisionsService.prototype, 'readProposal').mockResolvedValue(proposal);
    vi.spyOn(LifecareDecisionsService.prototype, 'readReasons').mockResolvedValue(catalogue);
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
    report = vi.spyOn(CaremanagementDecisionService.prototype, 'reportLifecareResult').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers the beslut just decided and receipts Lifecare’s id to careM', async () => {
    const create = vi.spyOn(LifecareDecisionsService.prototype, 'create').mockResolvedValue({ decisionId: 93 });

    const registration = await new LifecareDecisionRegistrationService().register('errand-1', 2, 'decision-1', bifall, 'test');

    expect(registration).toEqual({ decisionId: 'decision-1', outcome: 'REGISTERED', lifecareId: '93' });
    expect(create.mock.calls[0]?.[1]).toMatchObject({ decisionCode: 153, reasonCode: 16, amount: 5, decisionMaker: 'TEST' });
    expect(report).toHaveBeenCalledWith('errand-1', 'decision-1', { outcome: 'WRITTEN', lifecareId: '93' });
  });

  it('does not send a beslut whose orsak Lifecare does not know', async () => {
    const create = vi.spyOn(LifecareDecisionsService.prototype, 'create');

    const registration = await new LifecareDecisionRegistrationService().register(
      'errand-1',
      2,
      'decision-1',
      { ...bifall, reason: 'Något som inte finns' },
      'test',
    );

    expect(registration.outcome).toBe('NOT_SENT');
    expect(create).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
  });

  it('does not send delvis bifall', async () => {
    const create = vi.spyOn(LifecareDecisionsService.prototype, 'create');

    const registration = await new LifecareDecisionRegistrationService().register(
      'errand-1',
      2,
      'decision-1',
      { ...bifall, outcome: FinalizeDecisionOutcomeEnum.DELAVSLAG },
      'test',
    );

    expect(registration.outcome).toBe('NOT_SENT');
    expect(create).not.toHaveBeenCalled();
  });

  it('reports a refusal from Lifecare as FAILED with its reason', async () => {
    vi.spyOn(LifecareDecisionsService.prototype, 'create').mockRejectedValue(new HttpException(422, 'Lifecare godtog inte uppgifterna.'));

    const registration = await new LifecareDecisionRegistrationService().register('errand-1', 2, 'decision-1', bifall, 'test');

    expect(registration.outcome).toBe('FAILED');
    expect(report).toHaveBeenCalledWith('errand-1', 'decision-1', { outcome: 'FAILED', detail: 'Lifecare godtog inte uppgifterna.' });
  });

  it('reports nothing when Lifecare did not answer, since whether it wrote the beslut is unknown', async () => {
    vi.spyOn(LifecareDecisionsService.prototype, 'create').mockRejectedValue(new HttpException(502, 'Lifecare could not be reached (ETIMEDOUT)'));

    const registration = await new LifecareDecisionRegistrationService().register('errand-1', 2, 'decision-1', bifall, 'test');

    expect(registration.outcome).toBe('NOT_SENT');
    expect(report).not.toHaveBeenCalled();
  });
});
