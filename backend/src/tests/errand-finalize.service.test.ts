import CaremanagementApiService from '@services/caremanagement-api.service';
import DecisionNotificationService from '@services/decision-notification.service';
import ErrandFinalizeService from '@services/errand-finalize.service';
import { caremanagementLifecareUrl, caremanagementUrl } from '@utils/caremanagement-url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LifecareDecisionRegistrationOutcomeEnum, NormberakningDraftSourceEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const channels = { minaSidor: true, meddelande: true, brev: true, message: '<p>Hej,</p>', includeDecision: true, includeCalculation: true };
const communication = { minaSidor: true, digitalMailbox: false, letter: true };

const FINALIZE_URL = caremanagementUrl('errands', 'financial-assistance', 'errand-1', 'finalize');
const NORMBERAKNING_URL = caremanagementLifecareUrl('errand-1', 'normberakning');

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
  let patch: ReturnType<typeof vi.spyOn<CaremanagementApiService, 'patch'>>;
  let send: ReturnType<typeof vi.spyOn<DecisionNotificationService, 'send'>>;

  beforeEach(() => {
    get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({
      data: { hasCustomHouseholdSize: true, source: NormberakningDraftSourceEnum.LIFECARE },
      message: 'success',
      status: 200,
    });
    post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue({ data: finalized, message: 'success', status: 200 });
    patch = vi.spyOn(CaremanagementApiService.prototype, 'patch');
    send = vi.spyOn(DecisionNotificationService.prototype, 'send').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finalizes in careM without a decision, so careM reads the beslut from Lifecare, and sends the beslut', async () => {
    send.mockResolvedValue(['Brev']);

    const result = await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(get).toHaveBeenCalledWith({ url: NORMBERAKNING_URL });
    // Exactly this: no decision (careM reads the beslut from Lifecare) and no utbetalningar.
    expect(post).toHaveBeenCalledWith({ url: FINALIZE_URL, data: { communication, householdSizeChanged: true } });
    expect(send).toHaveBeenCalledWith('errand-1', channels, 'caseworker01', []);
    expect(result).toEqual({
      decisionId: 'decision-1',
      processMessageCorrelated: true,
      lifecareDecision: { decisionId: 'decision-1', outcome: 'REGISTERED', lifecareId: '98' },
      failedChannels: ['Brev'],
    });
  });

  it('leaves the Lifecare receipt, the access log and the id linking to careM', async () => {
    await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    // The finalize is the only write: no .../lifecare-result receipt, no events/lifecare report, no PATCH .../data.
    expect(post).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
    expect(patch).not.toHaveBeenCalled();
  });

  it("reports careM's failed Lifecare registration with careM's own reason", async () => {
    post.mockResolvedValue({
      data: {
        ...finalized,
        lifecareDecision: { decisionId: 'decision-1', outcome: LifecareDecisionRegistrationOutcomeEnum.FAILED, detail: 'Lifecare svarade inte' },
      },
      message: 'success',
      status: 200,
    });

    const result = await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(result.lifecareDecision).toEqual({ decisionId: 'decision-1', outcome: 'FAILED', detail: 'Lifecare svarade inte' });
  });

  it('records an unchanged household size when the errand has no normberäkning', async () => {
    get.mockRejectedValue(new HttpException(404, 'Not found'));

    await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(post).toHaveBeenCalledWith({ url: FINALIZE_URL, data: { communication, householdSizeChanged: false } });
  });

  it('finalizes nothing when the normberäkning cannot be read', async () => {
    get.mockRejectedValue(new HttpException(502, 'Lifecare could not be read'));

    await expect(new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01')).rejects.toMatchObject({ status: 502 });

    expect(post).not.toHaveBeenCalled();
  });

  it.each([
    [409, "errand must be in status AWAITING_DECISION to be finalized, but is in status 'GRANTED'"],
    [422, 'The beslut in Lifecare cannot be recorded as it stands: decision.amount must not be null'],
    [502, 'Lifecare could not be read'],
  ])("passes careM's %i refusal through and sends nothing", async (status, detail) => {
    post.mockRejectedValue(new HttpException(status, detail));

    await expect(new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01')).rejects.toMatchObject({ status, message: detail });

    expect(send).not.toHaveBeenCalled();
  });

  it("passes careM's 400 on with careM's own sentence, e.g. that the beslut must be saved first", async () => {
    post.mockRejectedValue(new HttpException(400, 'Spara beslutet innan du beslutar och betalar ut.'));

    await expect(new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01')).rejects.toMatchObject({
      status: 400,
      message: 'Spara beslutet innan du beslutar och betalar ut.',
    });

    expect(send).not.toHaveBeenCalled();
  });

  it('reports every selected channel as failed when the beslut could not be sent at all', async () => {
    send.mockRejectedValue(new HttpException(502, 'Failed to render the decision PDF'));

    const result = await new ErrandFinalizeService().finalize('errand-1', channels, 'caseworker01');

    expect(result.failedChannels).toEqual(['Meddelande', 'Brev']);
  });
});
