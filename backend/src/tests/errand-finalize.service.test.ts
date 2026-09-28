import CaremanagementApiService from '@services/caremanagement-api.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import DecisionDocumentsService from '@services/decision-documents.service';
import DecisionNotificationService from '@services/decision-notification.service';
import ErrandFinalizeService from '@services/errand-finalize.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import ErrandLifecareSectionStatusService from '@services/errand-lifecare-section-status.service';
import { caremanagementLifecareUrl, caremanagementUrl } from '@utils/caremanagement-url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LifecareDecisionRegistrationOutcomeEnum, NormberakningDraftSourceEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { LifecareDecisionView } from '@/responses/lifecare-decision.response';

const channels = {
  minaSidor: true,
  meddelande: true,
  brev: true,
  message: '<p>Hej,</p>',
  includeDecision: true,
  includeCalculation: true,
  lifecareDocumentIds: [],
};
const communication = { minaSidor: true, digitalMailbox: false, letter: true };

const FINALIZE_URL = caremanagementUrl('errands', 'financial-assistance', 'errand-1', 'finalize');
const NORMBERAKNING_URL = caremanagementLifecareUrl('errand-1', 'normberakning');

const decisionFile = { buffer: Buffer.from('%PDF-beslut'), originalname: 'beslut-EB-26090039.pdf', mimetype: 'application/pdf' };
const allDone = { calculationFinalized: true, decisionSaved: true, paymentRegistered: true };

/** careM's answer to a finalize it accepted, the Lifecare receipt made in the same call. */
const finalized = {
  decisionId: 'decision-1',
  processMessageCorrelated: true,
  communication,
  lifecareDecision: { decisionId: 'decision-1', outcome: LifecareDecisionRegistrationOutcomeEnum.REGISTERED, lifecareId: '98' },
};

describe('ErrandFinalizeService.finalize', () => {
  let get: ReturnType<typeof vi.spyOn<CaremanagementApiService, 'get'>>;
  let post: ReturnType<typeof vi.spyOn<CaremanagementApiService, 'post'>>;
  let sectionStatus: ReturnType<typeof vi.spyOn<ErrandLifecareSectionStatusService, 'read'>>;
  let beslut: ReturnType<typeof vi.spyOn<ErrandLifecareDecisionService, 'read'>>;
  let collect: ReturnType<typeof vi.spyOn<DecisionDocumentsService, 'collect'>>;
  let saveDecision: ReturnType<typeof vi.spyOn<DecisionDocumentsService, 'saveDecisionOnErrand'>>;
  let send: ReturnType<typeof vi.spyOn<DecisionNotificationService, 'send'>>;

  beforeEach(() => {
    get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({
      data: { hasCustomHouseholdSize: true, source: NormberakningDraftSourceEnum.LIFECARE },
      message: 'success',
      status: 200,
    });
    post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue({ data: finalized, message: 'success', status: 200 });
    sectionStatus = vi.spyOn(ErrandLifecareSectionStatusService.prototype, 'read').mockResolvedValue(allDone);
    beslut = vi.spyOn(ErrandLifecareDecisionService.prototype, 'read').mockResolvedValue({ outcome: 'BIFALL' } as LifecareDecisionView);
    vi.spyOn(CaremanagementErrandService.prototype, 'getErrand').mockResolvedValue({ data: { errandNumber: 'EB-26090039' }, message: 'success' });
    collect = vi.spyOn(DecisionDocumentsService.prototype, 'collect').mockResolvedValue({ decision: decisionFile, attachments: [decisionFile] });
    saveDecision = vi.spyOn(DecisionDocumentsService.prototype, 'saveDecisionOnErrand').mockResolvedValue(true);
    send = vi.spyOn(DecisionNotificationService.prototype, 'send').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches the documents, finalizes in careM without a decision, then keeps the beslut and sends it', async () => {
    send.mockResolvedValue(['Brev']);

    const result = await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(collect).toHaveBeenCalledWith('errand-1', 'EB-26090039', channels, []);
    expect(get).toHaveBeenCalledWith({ url: NORMBERAKNING_URL });
    // Exactly this: no decision (careM reads the beslut from Lifecare) and no utbetalningar.
    expect(post).toHaveBeenCalledWith({ url: FINALIZE_URL, data: { communication, householdSizeChanged: true } });
    expect(collect.mock.invocationCallOrder[0]).toBeLessThan(post.mock.invocationCallOrder[0] ?? 0);
    expect(saveDecision).toHaveBeenCalledWith('errand-1', decisionFile);
    expect(send).toHaveBeenCalledWith('errand-1', channels, 'caseworker01', [decisionFile]);
    expect(result).toEqual({
      decisionId: 'decision-1',
      processMessageCorrelated: true,
      lifecareDecision: { decisionId: 'decision-1', outcome: 'REGISTERED', lifecareId: '98' },
      decisionAttachmentSaved: true,
      failedChannels: ['Brev'],
    });
  });

  it.each([
    [{ ...allDone, calculationFinalized: false }, 'BIFALL', 'Spara normberäkningen som slutlig innan du skickar beräkning och beslut.'],
    [{ ...allDone, decisionSaved: false }, undefined, 'Spara beslutet innan du skickar beräkning och beslut.'],
    [{ ...allDone, paymentRegistered: false }, 'BIFALL', 'Registrera utbetalningen innan du skickar beräkning och beslut.'],
  ])('decides and fetches nothing until Lifecare has everything the beslut rests on', async (status, outcome, reason) => {
    sectionStatus.mockResolvedValue(status);
    beslut.mockResolvedValue(outcome ? ({ outcome } as LifecareDecisionView) : undefined);

    await expect(new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01')).rejects.toMatchObject({ status: 409, message: reason });

    expect(collect).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('decides nothing when a document cannot be fetched', async () => {
    collect.mockRejectedValue(new HttpException(502, 'Beslutet kunde inte hämtas från Lifecare. Inget är beslutat eller skickat.'));

    await expect(new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01')).rejects.toMatchObject({ status: 502 });

    expect(post).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('still sends the beslut when it could not be kept on the errand, and reports that', async () => {
    saveDecision.mockResolvedValue(false);

    const result = await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(send).toHaveBeenCalled();
    expect(result.decisionAttachmentSaved).toBe(false);
  });

  it('records an unchanged household size when the errand has no normberäkning', async () => {
    get.mockRejectedValue(new HttpException(404, 'Not found'));

    await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(post).toHaveBeenCalledWith({ url: FINALIZE_URL, data: { communication, householdSizeChanged: false } });
  });

  it.each([
    [400, 'Spara beslutet innan du beslutar och betalar ut.'],
    [409, "errand must be in status AWAITING_DECISION to be finalized, but is in status 'GRANTED'"],
    [422, 'The beslut in Lifecare cannot be recorded as it stands: decision.amount must not be null'],
    [502, 'Lifecare could not be read'],
  ])("passes careM's %i refusal through and neither keeps nor sends the beslut", async (status, detail) => {
    post.mockRejectedValue(new HttpException(status, detail));

    await expect(new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01')).rejects.toMatchObject({ status, message: detail });

    expect(saveDecision).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('reports every selected channel as failed when the beslut could not be sent at all', async () => {
    send.mockRejectedValue(new HttpException(502, 'Messaging svarade inte'));

    const result = await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(result.failedChannels).toEqual(['Meddelande', 'Brev']);
  });
});
