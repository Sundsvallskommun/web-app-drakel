import { LifecareDecisionProposalRaw } from '@interfaces/lifecare-decision.interface';
import { buildDecisionCreate } from '@utils/lifecare-decision';
import { describe, expect, it } from 'vitest';

/** Decision/GetProposalForService?businessType=8&businessId=2 (capture 2026-09-23), `decision` in full. */
const proposal = (): LifecareDecisionProposalRaw => ({
  decision: {
    decisionId: 0,
    serviceId: 2,
    investigationExecutionId: 0,
    ownerPersonId: '199001122390',
    decisionCode: 0,
    decisionType: 0,
    date: '2026-09-23',
    fromDate: '',
    toDate: '',
    reasonCode: 0,
    reason: null,
    reasonHeader: null,
    reasonCodeCoApplicant: 0,
    reasonCoApplicant: null,
    reasonHeaderCoApplicant: null,
    decisionMaker: 'RPA_031DEV',
    decisionMakerName: null,
    decisionMakerTitle: null,
    updateDate: '',
    updateTime: null,
    updateSignature: null,
    registrationDate: '',
    registrationSignature: null,
    decisionPersons: [
      {
        decisionId: 0,
        personId: '199001122390',
        name: 'Jeppson, Test',
        personKey: null,
        coApplicant: false,
        included: false,
        includedTypes: [0, 2, 1],
        notificationType: 0,
        notificationTypeText: null,
        notificationDate: '',
        receivedDate: '',
        registeredBy: null,
        personIdFormatted: '900112-2390',
      },
    ],
    decisionParts: [],
    amount: 0,
    coApplicant: null,
    decisionText: null,
    hasDecisionMessage: false,
    hasNoCoApplicant: false,
    hasNotification: false,
    amountToBalance: false,
    bidrTfnr: 0,
    connectedDecisionId: 0,
    uiCanRemit: false,
    uiCanAdjust: false,
    uiCanDelete: false,
    leadsToService: false,
    dontExecute: false,
    type: null,
    decisionSummarys: null,
    refunds: null,
    remitsOrAdjusts: null,
    lifecareCreated: false,
    message: null,
    messageIsRevised: false,
    aktualiseringId: null,
    applicationText: null,
    lockedMessage: false,
    typeOfProtocol: null,
    typeOfProtocolText: null,
    sharedCustody: false,
    statisticsException: false,
    doesentLeadsToLMAssignment: false,
    canLeadToLMAssignment: false,
    connectedLMAssignmentId: 0,
    connectedAssignmentIfoId: 0,
    connectedAssignmentIfoIdWithResourceTypeGroup: 0,
    connectedAssignmentId: 0,
    doesentLeadToAssignment: false,
    leadsToOrderEC: false,
    connectedOrderECId: 0,
    status: 0,
    whereDidChildGoType: 0,
    whereDidChildGoTypeText: null,
    guardianType: 0,
    guardianTypeText: null,
    canUnlink: false,
    organisationName: null,
    isFromProposal: false,
    proposalText: null,
    workflow: 0,
    canBeSelected: true,
  },
  decisionMakers: [
    { id: 'IAN', name: 'Individ- och arbetsmarknadsnämnden', title: 'Socialnämnd' },
    { id: 'RPA_031DEV', name: 'RPA_031DEV', title: 'Automatiserad testhandläggare' },
    { id: 'TEST', name: 'Test Handläggare', title: 'Testhandläggare' },
  ],
  decisionTypes: [
    { code: 152, name: 'EK Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, avslag', type: 10, isActive: true, requiresFromDate: false, requiresToDate: false },
    { code: 153, name: 'Ek Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, bifall', type: 0, isActive: true, requiresFromDate: true, requiresToDate: true },
  ],
});

const bifall = {
  decisionCode: 153,
  periodFrom: '2026-09-01',
  periodTo: '2026-09-30',
  amount: 5,
  reasonCode: 16,
  message: '<p>test av beslutsmeddelande</p>',
  decisionMakerId: 'RPA_031DEV',
};

describe('buildDecisionCreate', () => {
  it('turns the captured underlag into exactly the captured Decision/Create body', () => {
    const create = buildDecisionCreate(proposal(), bifall);

    // Decision/Create?businessType=8&businessId=2 (capture 2026-09-23), field for field and in order.
    const capture = {
      decisionId: 0,
      serviceId: 2,
      investigationExecutionId: 0,
      ownerPersonId: '199001122390',
      decisionCode: 153,
      decisionType: 0,
      date: '2026-09-23',
      fromDate: '2026-09-01',
      toDate: '2026-09-30',
      reasonCode: 16,
      reason: null,
      reasonHeader: null,
      reasonCodeCoApplicant: '',
      reasonCoApplicant: null,
      reasonHeaderCoApplicant: null,
      decisionMaker: 'RPA_031DEV',
      decisionMakerName: null,
      decisionMakerTitle: 'Automatiserad testhandläggare',
      updateDate: '',
      updateTime: null,
      updateSignature: null,
      registrationDate: '',
      registrationSignature: null,
      decisionPersons: [
        {
          decisionId: 0,
          personId: '199001122390',
          name: 'Jeppson, Test',
          personKey: null,
          coApplicant: false,
          included: true,
          includedTypes: [0, 2, 1],
          notificationTypeText: null,
          notificationDate: '',
          receivedDate: '',
          registeredBy: null,
          personIdFormatted: '900112-2390',
          personIdAndName: '900112-2390, Jeppson, Test',
          receivedDateIsInvalid: false,
          isValid: true,
        },
      ],
      decisionParts: [],
      amount: 5,
      coApplicant: 'NOONE',
      decisionText: null,
      hasDecisionMessage: false,
      hasNoCoApplicant: false,
      hasNotification: false,
      amountToBalance: false,
      bidrTfnr: 0,
      connectedDecisionId: 0,
      uiCanRemit: false,
      uiCanAdjust: false,
      uiCanDelete: false,
      leadsToService: false,
      dontExecute: false,
      type: null,
      decisionSummarys: null,
      refunds: null,
      remitsOrAdjusts: null,
      lifecareCreated: false,
      message: '<p>test av beslutsmeddelande</p>',
      messageIsRevised: false,
      applicationText: null,
      lockedMessage: false,
      typeOfProtocol: null,
      typeOfProtocolText: null,
      statisticsException: false,
      doesentLeadsToLMAssignment: false,
      canLeadToLMAssignment: false,
      connectedLMAssignmentId: 0,
      connectedAssignmentIfoId: 0,
      connectedAssignmentIfoIdWithResourceTypeGroup: 0,
      connectedAssignmentId: 0,
      doesentLeadToAssignment: false,
      leadsToOrderEC: false,
      connectedOrderECId: 0,
      status: 0,
      whereDidChildGoTypeText: null,
      guardianTypeText: null,
      canUnlink: false,
      organisationName: null,
      isFromProposal: false,
      proposalText: null,
      workflow: 0,
      canBeSelected: true,
    };
    expect(create.writable ? JSON.stringify(create.body) : create.reason).toBe(JSON.stringify(capture));
  });

  it('names the handläggare as beslutsfattare whatever the case of their signature', () => {
    const create = buildDecisionCreate(proposal(), { ...bifall, decisionMakerId: 'test' });

    expect(create.writable && [create.body.decisionMaker, create.body.decisionMakerTitle]).toEqual(['TEST', 'Testhandläggare']);
  });

  it('refuses a handläggare Lifecare does not know as beslutsfattare, never falling back', () => {
    expect(buildDecisionCreate(proposal(), { ...bifall, decisionMakerId: 'oli09bor' }).writable).toBe(false);
  });

  it('registers any bifall type Lifecare offers, going by its category rather than its code', () => {
    const withSection2 = proposal();
    withSection2.decisionTypes.push({
      code: 150,
      name: 'EK Ekonomiskt bistånd 12 Kap 2 § SoL, bifall',
      type: 0,
      isActive: true,
      requiresFromDate: true,
      requiresToDate: true,
    });

    const create = buildDecisionCreate(withSection2, { ...bifall, decisionCode: 150 });

    expect(create.writable && create.body.decisionCode).toBe(150);
  });

  it('refuses a beslutstyp Drakel does not register yet, however Lifecare offers it', () => {
    const withRecovery = proposal();
    withRecovery.decisionTypes.push({
      code: 161,
      name: 'EK Återkrav Ekonomiskt bistånd, grundbeslut',
      isActive: true,
      requiresFromDate: false,
      requiresToDate: false,
    });

    expect(buildDecisionCreate(withRecovery, { ...bifall, decisionCode: 161 })).toEqual({
      writable: false,
      reason: expect.stringContaining('EK Återkrav Ekonomiskt bistånd, grundbeslut') as string,
    });
  });

  it('refuses a household with a medsökande rather than sending NOONE', () => {
    const withCoApplicant = proposal();
    const [applicant] = withCoApplicant.decision.decisionPersons;
    if (applicant) {
      withCoApplicant.decision.decisionPersons.push({ ...applicant, personId: '198501012222', coApplicant: true });
    }

    expect(buildDecisionCreate(withCoApplicant, bifall).writable).toBe(false);
  });

  it('refuses a bifall without the period its type requires, but takes an avslag without one', () => {
    expect(buildDecisionCreate(proposal(), { ...bifall, periodFrom: undefined }).writable).toBe(false);
    expect(buildDecisionCreate(proposal(), { ...bifall, decisionCode: 152, amount: 0, periodFrom: undefined, periodTo: undefined }).writable).toBe(
      true,
    );
  });
});
