import CaremanagementApiService from '@services/caremanagement-api.service';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import { caremanagementLifecareUrl, caremanagementUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LifecareDecisionView as CaremanagementDecisionView, LifecareDecisionViewOutcomeEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const DECISION_URL = caremanagementLifecareUrl('errand-1', 'decision');

// The beslut as careM answers it — the same fields the BFF answers with, without the { data, message } envelope.
const decision: CaremanagementDecisionView = {
  id: 98,
  decisionCode: 153,
  outcome: LifecareDecisionViewOutcomeEnum.BIFALL,
  date: '2026-09-23',
  periodFrom: '2026-09-01',
  periodTo: '2026-09-30',
  amount: 3000,
  reasonCode: 19,
  reason: 'Arbetar deltid ofrivilligt, otillräcklig inkomst',
  message: '<p>Beslut</p>',
  locked: false,
  decisionMaker: 'Test Handläggare',
};

const bifall = {
  decisionCode: 153,
  periodFrom: '2026-09-01',
  periodTo: '2026-09-30',
  amount: 3000,
  reasonCode: 19,
  decisionMessage: '<p>Beslut</p>',
};

const answers = (data: unknown, status = 200) => ({ data, message: 'success', status });

describe('ErrandLifecareDecisionService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the errand's beslut from careM", async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answers(decision));

    expect(await new ErrandLifecareDecisionService().read('errand-1')).toEqual(decision);
    expect(get).toHaveBeenCalledWith({ url: DECISION_URL });
  });

  it('has no beslut to show while careM answers 204', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answers('', 204));

    expect(await new ErrandLifecareDecisionService().read('errand-1')).toBeUndefined();
  });

  it("gives a field careM's contract leaves optional careM's own none value", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answers({ id: 98, decisionCode: 152 }));

    expect(await new ErrandLifecareDecisionService().read('errand-1')).toEqual({
      id: 98,
      decisionCode: 152,
      date: '',
      amount: 0,
      locked: false,
      decisionMaker: '',
    });
  });

  it('saves the beslut through careM, passing the handläggare’s input on as careM’s save request', async () => {
    const put = vi.spyOn(CaremanagementApiService.prototype, 'put').mockResolvedValue(answers(decision));

    const view = await new ErrandLifecareDecisionService().save('errand-1', { ...bifall, writeProtect: true });

    expect(put).toHaveBeenCalledWith({ url: DECISION_URL, data: { ...bifall, writeProtect: true } });
    expect(view).toEqual(decision);
  });

  it('hands back careM’s refusal as it came, e.g. a 422 for a beslut that cannot be saved', async () => {
    const refusal = 'Beslutstypen EK Återkrav kan inte registreras från careM.';
    vi.spyOn(CaremanagementApiService.prototype, 'put').mockRejectedValue(new HttpException(422, refusal));

    await expect(new ErrandLifecareDecisionService().save('errand-1', { ...bifall, decisionCode: 161 })).rejects.toMatchObject({
      status: 422,
      message: refusal,
    });
  });

  it('lists the beslutstyper the insats offers, as careM marks them', async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(
      answers([
        { code: 152, name: 'EK Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, avslag', outcome: 'AVSLAG', requiresFromDate: false, requiresToDate: false },
        { code: 161, name: 'EK Återkrav', requiresFromDate: false, requiresToDate: false },
      ]),
    );

    const types = await new ErrandLifecareDecisionService().types('errand-1');

    expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'decision', 'types') });
    expect(types).toEqual([
      { code: 152, name: 'EK Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, avslag', outcome: 'AVSLAG', requiresFromDate: false, requiresToDate: false },
      { code: 161, name: 'EK Återkrav', requiresFromDate: false, requiresToDate: false },
    ]);
  });

  it('lists the orsaker of a beslutstyp from careM’s catalogue, which lives outside the errand', async () => {
    const reason = { code: 19, name: 'Arbetar deltid ofrivilligt, otillräcklig inkomst', header: 'Arbetar deltid, ofrivilligt' };
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answers([reason]));

    expect(await new ErrandLifecareDecisionService().reasons(153)).toEqual([reason]);
    expect(get).toHaveBeenCalledWith({ url: caremanagementUrl('errands', 'financial-assistance', 'lifecare', 'decision-types', '153', 'reasons') });
    expect(get.mock.calls[0]?.[0].url).toMatch(/\/errands\/financial-assistance\/lifecare\/decision-types\/153\/reasons$/);
  });

  it('asks careM for no orsaker of a beslutstyp code that is not a whole number', async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get');

    await expect(new ErrandLifecareDecisionService().reasons(Number.NaN)).rejects.toMatchObject({ status: 400 });
    expect(get).not.toHaveBeenCalled();
  });

  it('gives Lifecare’s print of the beslut, which careM answers raw, as a Buffer', async () => {
    const pdfBytes = new TextEncoder().encode('%PDF-1.7 beslut');
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answers(pdfBytes.buffer));

    const pdf = await new ErrandLifecareDecisionService().pdf('errand-1');

    expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'decision', 'pdf'), responseType: 'arraybuffer' });
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.toString()).toBe('%PDF-1.7 beslut');
  });

  it('has no PDF to give while no beslut is saved (careM answers 404)', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockRejectedValue(new HttpException(404, 'Not found'));

    await expect(new ErrandLifecareDecisionService().pdf('errand-1')).rejects.toMatchObject({ status: 404 });
  });

  it('links careM’s finalized decision to the Lifecare beslut', async () => {
    const report = vi.spyOn(CaremanagementDecisionService.prototype, 'reportLifecareResult').mockResolvedValue();

    const registration = await new ErrandLifecareDecisionService().receiptFinalized('errand-1', 'decision-1', 98);

    expect(report).toHaveBeenCalledWith('errand-1', 'decision-1', { outcome: 'WRITTEN', lifecareId: '98' });
    expect(registration).toEqual({ decisionId: 'decision-1', outcome: 'REGISTERED', lifecareId: '98' });
  });
});
