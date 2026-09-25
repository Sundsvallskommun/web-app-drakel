import { LifecareDecisionController } from '@controllers/lifecare-decision.controller';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

// careM answers without the { data, message } envelope; the BFF keeps answering with it.
const decision = {
  id: 98,
  decisionCode: 153,
  outcome: 'BIFALL',
  date: '2026-09-23',
  amount: 3000,
  locked: false,
  decisionMaker: 'Test Handläggare',
};

const answers = (data: unknown, status = 200) => ({ data, message: 'success', status });

describe('LifecareDecisionController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("wraps careM's beslut in the BFF's envelope", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answers(decision));

    expect(await new LifecareDecisionController().read('errand-1')).toEqual({ data: decision, message: 'success' });
  });

  it("answers data: null for careM's 204, while no beslut is saved", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answers('', 204));

    expect(await new LifecareDecisionController().read('errand-1')).toEqual({ data: null, message: 'success' });
  });

  it('saves the beslut with careM and answers with the beslut as it stands after the save', async () => {
    const put = vi.spyOn(CaremanagementApiService.prototype, 'put').mockResolvedValue(answers(decision));
    const input = { decisionCode: 153, periodFrom: '2026-09-01', periodTo: '2026-09-30', amount: 3000 };

    expect(await new LifecareDecisionController().save('errand-1', input)).toEqual({ data: decision, message: 'success' });
    expect(put).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'decision'), data: input });
  });

  it('lets a careM refusal through with its status and reason', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'put').mockRejectedValue(new HttpException(422, 'Beslutet är låst i Lifecare.'));

    await expect(new LifecareDecisionController().save('errand-1', { decisionCode: 153 })).rejects.toMatchObject({
      status: 422,
      message: 'Beslutet är låst i Lifecare.',
    });
  });

  it('wraps the beslutstyper and the orsaker in the envelope', async () => {
    const type = { code: 153, name: 'Bifall', outcome: 'BIFALL', requiresFromDate: true, requiresToDate: true };
    const reason = { code: 19, name: 'Arbetar deltid ofrivilligt, otillräcklig inkomst', header: 'Arbetar deltid, ofrivilligt' };
    vi.spyOn(CaremanagementApiService.prototype, 'get')
      .mockResolvedValueOnce(answers([type]))
      .mockResolvedValueOnce(answers([reason]));

    expect(await new LifecareDecisionController().types('errand-1')).toEqual({ data: [type], message: 'success' });
    expect(await new LifecareDecisionController().reasons(153)).toEqual({ data: [reason], message: 'success' });
  });

  it("turns careM's raw PDF into the base64 the BFF answers with", async () => {
    const pdfBytes = new TextEncoder().encode('%PDF-1.7 beslut');
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answers(pdfBytes.buffer));

    expect(await new LifecareDecisionController().pdf('errand-1')).toEqual({
      data: Buffer.from('%PDF-1.7 beslut').toString('base64'),
      message: 'success',
    });
  });
});
