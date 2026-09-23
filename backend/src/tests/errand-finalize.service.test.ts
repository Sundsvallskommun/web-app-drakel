import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import CaremanagementPaymentService from '@services/caremanagement-payment.service';
import DecisionNotificationService from '@services/decision-notification.service';
import ErrandFinalizeService from '@services/errand-finalize.service';
import LifecareDecisionRegistrationService from '@services/lifecare-decision-registration.service';
import LifecarePaymentRegistrationService from '@services/lifecare-payment-registration.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

const channels = { minaSidor: true, digitalBrevlada: false, brev: true };

const draft = {
  id: 'draft-1',
  status: 'DRAFT',
  paymentDate: '2026-06-26',
  amount: 7900,
  applicationMonth: '2026-06',
  payeeName: 'Anna Andersson',
  paymentMethod: 'Bankkonto',
};

describe('ErrandFinalizeService.finalize', () => {
  let registerDecision: ReturnType<typeof vi.spyOn<LifecareDecisionRegistrationService, 'register'>>;

  beforeEach(() => {
    vi.spyOn(CaremanagementDecisionService.prototype, 'readDecisions').mockResolvedValue({
      data: [{ value: 'BIFALL', amount: 7900, decisionMessage: '<p>Beslut</p>' }],
      message: 'success',
    });
    vi.spyOn(CaremanagementDecisionService.prototype, 'readDecisionProposal').mockResolvedValue({
      data: { reason: 'Föreslagen orsak' },
      message: 'success',
    });
    vi.spyOn(CaremanagementPaymentService.prototype, 'listPayments').mockResolvedValue({ data: [draft], message: 'success' });
    vi.spyOn(CaremanagementNormberakningService.prototype, 'readHouseholdSizeChanged').mockResolvedValue(false);
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
      data: { lifecareServiceId: 1 },
      message: 'success',
    });
    registerDecision = vi.spyOn(LifecareDecisionRegistrationService.prototype, 'register').mockResolvedValue({
      decisionId: 'decision-1',
      outcome: 'REGISTERED',
      lifecareId: '93',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finalizes, removes the drafts it sent and sends the beslut', async () => {
    const finalize = vi.spyOn(CaremanagementDecisionService.prototype, 'finalize').mockResolvedValue({
      data: {
        decisionId: 'decision-1',
        paymentIds: ['payment-1'],
        processMessageCorrelated: true,
        rpaTasks: [
          { action: 'WRITE_DECISION', enqueued: true },
          { action: 'REGISTER_PAYMENT', enqueued: false },
        ],
      },
      message: 'success',
    });
    const deletePayment = vi.spyOn(CaremanagementPaymentService.prototype, 'deletePayment').mockResolvedValue({ data: null, message: 'success' });
    const send = vi.spyOn(DecisionNotificationService.prototype, 'send').mockResolvedValue(['Brev']);
    const register = vi
      .spyOn(LifecarePaymentRegistrationService.prototype, 'register')
      .mockResolvedValue({ paymentId: 'payment-1', outcome: 'REGISTERED', lifecareId: '4' });

    const result = await new ErrandFinalizeService().finalize('errand-1', { ...channels, reason: 'Arbetslös' }, 'caseworker01');

    expect(finalize.mock.calls[0]?.[1]).toMatchObject({
      decision: { outcome: 'BIFALL', reason: 'Arbetslös', amount: 7900 },
      communication: { minaSidor: true, digitalMailbox: false, letter: true },
    });
    expect(deletePayment).toHaveBeenCalledWith('errand-1', 'draft-1');
    expect(register).toHaveBeenCalledWith('errand-1', 1, 'payment-1');
    expect(registerDecision.mock.calls[0]?.slice(0, 3)).toEqual(['errand-1', 1, 'decision-1']);
    expect(registerDecision.mock.calls[0]?.[3]).toMatchObject({ outcome: 'BIFALL', reason: 'Arbetslös', amount: 7900 });
    expect(registerDecision.mock.calls[0]?.[4]).toBe('caseworker01');
    expect(send).toHaveBeenCalledWith('errand-1', expect.objectContaining(channels), 'caseworker01');
    expect(result).toEqual({
      decisionId: 'decision-1',
      paymentIds: ['payment-1'],
      payeeWarnings: [],
      failedRpaTasks: ['REGISTER_PAYMENT'],
      processMessageCorrelated: true,
      lifecareDecision: { decisionId: 'decision-1', outcome: 'REGISTERED', lifecareId: '93' },
      lifecarePayments: [{ paymentId: 'payment-1', outcome: 'REGISTERED', lifecareId: '4' }],
      failedChannels: ['Brev'],
    });
  });

  it('keeps the finalize when registering an utbetalning in Lifecare throws', async () => {
    vi.spyOn(CaremanagementDecisionService.prototype, 'finalize').mockResolvedValue({ data: { paymentIds: ['payment-1'] }, message: 'success' });
    vi.spyOn(CaremanagementPaymentService.prototype, 'deletePayment').mockResolvedValue({ data: null, message: 'success' });
    vi.spyOn(DecisionNotificationService.prototype, 'send').mockResolvedValue([]);
    vi.spyOn(LifecarePaymentRegistrationService.prototype, 'register').mockRejectedValue(new HttpException(502, 'Lifecare could not be reached'));

    const result = await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(result.lifecarePayments).toEqual([{ paymentId: 'payment-1', outcome: 'NOT_SENT', detail: expect.any(String) as string }]);
  });

  it('falls back to the proposed orsak when the handläggare never picked one', async () => {
    const finalize = vi.spyOn(CaremanagementDecisionService.prototype, 'finalize').mockResolvedValue({ data: {}, message: 'success' });
    vi.spyOn(CaremanagementPaymentService.prototype, 'deletePayment').mockResolvedValue({ data: null, message: 'success' });
    vi.spyOn(DecisionNotificationService.prototype, 'send').mockResolvedValue([]);

    await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(finalize.mock.calls[0]?.[1].decision.reason).toBe('Föreslagen orsak');
  });

  it('leaves the drafts and sends nothing when caremanagement refuses the finalize', async () => {
    vi.spyOn(CaremanagementDecisionService.prototype, 'finalize').mockRejectedValue(new HttpException(409, 'Already finalized'));
    const deletePayment = vi.spyOn(CaremanagementPaymentService.prototype, 'deletePayment');
    const send = vi.spyOn(DecisionNotificationService.prototype, 'send');

    await expect(new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01')).rejects.toMatchObject({ status: 409 });

    expect(deletePayment).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('reports every selected channel as failed when the beslut could not be sent at all', async () => {
    vi.spyOn(CaremanagementDecisionService.prototype, 'finalize').mockResolvedValue({ data: {}, message: 'success' });
    vi.spyOn(CaremanagementPaymentService.prototype, 'deletePayment').mockResolvedValue({ data: null, message: 'success' });
    vi.spyOn(DecisionNotificationService.prototype, 'send').mockRejectedValue(new HttpException(502, 'Failed to render the decision PDF'));

    const result = await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(result.failedChannels).toEqual(['Mina sidor', 'Brev']);
  });
});
