import { buildFinalizeRequest, draftPayments, toFinalizePayment } from '@utils/finalize-request';
import { describe, expect, it } from 'vitest';

import { FinalizeDecisionOutcomeEnum, Payment, PaymentStatusEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareDecisionView } from '@/responses/lifecare-decision.response';

const communication = { minaSidor: true, digitalMailbox: false, letter: true };

/** The beslut as it stands in Lifecare. */
const beslut = {
  id: 98,
  outcome: 'BIFALL',
  date: '2026-06-20',
  amount: 7900,
  periodFrom: '2026-06-01',
  periodTo: '2026-06-30',
  reason: 'Arbetslös',
  message: '<p>Du beviljas bistånd</p>',
  locked: false,
  decisionMaker: 'Test Handläggare',
} satisfies LifecareDecisionView;

const draft: Payment = {
  id: 'draft-1',
  status: PaymentStatusEnum.DRAFT,
  paymentDate: '2026-06-26',
  amount: 7900,
  applicationMonth: '2026-06',
  payeeId: 'payee-1',
  payeeName: 'Anna Andersson',
  paymentMethod: 'Bankkonto',
  clearingNumber: '8327',
  accountNumber: '1234567',
  accountingCode: 'K1',
};

describe('draftPayments', () => {
  it('keeps only the rows nothing has handed to Lifecare yet', () => {
    const payments: Payment[] = [
      draft,
      { ...draft, id: 'pending', status: PaymentStatusEnum.PENDING_REGISTRATION },
      { ...draft, id: 'failed', status: PaymentStatusEnum.FAILED },
    ];

    expect(draftPayments(payments).map(payment => payment.id)).toEqual(['draft-1']);
  });
});

describe('toFinalizePayment', () => {
  it('maps a draft onto the finalize payment, payee id included', () => {
    expect(toFinalizePayment(draft)).toEqual({
      paymentDate: '2026-06-26',
      amount: 7900,
      concernedMonth: '2026-06',
      payee: { id: 'payee-1', name: 'Anna Andersson', paymentMethod: 'Bankkonto', clearing: '8327', accountNumber: '1234567' },
      accountingCode: 'K1',
    });
  });

  it('cuts a full date down to the month it concerns', () => {
    expect(toFinalizePayment({ ...draft, applicationMonth: '2026-06-01' }).concernedMonth).toBe('2026-06');
  });

  it('refuses a draft without a payee', () => {
    expect(() => toFinalizePayment({ ...draft, payeeName: undefined })).toThrow(expect.objectContaining({ status: 400 }));
  });
});

describe('buildFinalizeRequest', () => {
  it('builds the payload from the Lifecare beslut and the drafts', () => {
    const request = buildFinalizeRequest({ beslut, drafts: [draft], communication, householdSizeChanged: true });

    expect(request.decision).toEqual({
      outcome: FinalizeDecisionOutcomeEnum.BIFALL,
      reason: 'Arbetslös',
      periodFrom: '2026-06-01',
      periodTo: '2026-06-30',
      amount: 7900,
      decisionMessage: '<p>Du beviljas bistånd</p>',
    });
    expect(request.communication).toBe(communication);
    expect(request.payments).toHaveLength(1);
    expect(request.householdSizeChanged).toBe(true);
  });

  it('sends no payments and no amount for an avslag, whatever drafts were saved', () => {
    const request = buildFinalizeRequest({
      beslut: { ...beslut, outcome: 'AVSLAG', amount: 0 },
      drafts: [draft],
      communication,
      householdSizeChanged: false,
    });

    expect(request.payments).toEqual([]);
    expect(request.decision.amount).toBe(0);
  });

  it('refuses when no beslut has been saved', () => {
    expect(() => buildFinalizeRequest({ beslut: undefined, drafts: [draft], communication, householdSizeChanged: false })).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  it('refuses a granting beslut without any utbetalning', () => {
    expect(() => buildFinalizeRequest({ beslut, drafts: [], communication, householdSizeChanged: false })).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  it('refuses a Lifecare beslutstyp Drakel does not finalize', () => {
    expect(() =>
      buildFinalizeRequest({
        beslut: { ...beslut, outcome: undefined },
        drafts: [draft],
        communication,
        householdSizeChanged: false,
      }),
    ).toThrow(expect.objectContaining({ status: 400 }));
  });
});
