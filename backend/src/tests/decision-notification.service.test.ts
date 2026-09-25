import CaremanagementAttachmentService from '@services/caremanagement-attachment.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import DecisionNotificationService from '@services/decision-notification.service';
import ErrandLifecareCalculationService from '@services/errand-lifecare-calculation.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import MessagingService from '@services/messaging.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const MESSAGE = 'Hej,\nDin ansökan för september 2026 är klar. Se bifogade dokument.';
const ownFile = { buffer: Buffer.from('%PDF-own'), originalname: 'hyresavi.pdf', mimetype: 'application/pdf' };

describe('DecisionNotificationService.send', () => {
  beforeEach(() => {
    vi.spyOn(ErrandLifecareDecisionService.prototype, 'pdf').mockResolvedValue(Buffer.from('%PDF-beslut'));
    vi.spyOn(ErrandLifecareCalculationService.prototype, 'pdf').mockResolvedValue(Buffer.from('%PDF-berakning').toString('base64'));
    vi.spyOn(CaremanagementErrandService.prototype, 'getErrand').mockResolvedValue({ data: { errandNumber: 'EB-26090039' }, message: 'success' });
    vi.spyOn(CaremanagementStakeholderService.prototype, 'readStakeholders').mockResolvedValue({
      data: [{ role: 'APPLICANT', externalId: 'applicant-party' }],
      message: 'success',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the handläggare's message with the beslut, the beräkning and their own files through every channel", async () => {
    const saveOnErrand = vi
      .spyOn(CaremanagementAttachmentService.prototype, 'createAttachment')
      .mockResolvedValue({ data: null, message: 'success' });
    const minaSidor = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const letter = vi.spyOn(MessagingService.prototype, 'sendLetter').mockResolvedValue();

    const failed = await new DecisionNotificationService().send(
      'errand-1',
      { minaSidor: true, brev: true, message: MESSAGE, includeDecision: true, includeCalculation: true },
      'caseworker01',
      [ownFile],
    );

    expect(failed).toEqual([]);
    expect(saveOnErrand).toHaveBeenCalledWith('errand-1', expect.objectContaining({ originalname: 'beslut-EB-26090039.pdf' }), 'DECISION');
    const sentFiles = ['beslut-EB-26090039.pdf', 'normberakning-EB-26090039.pdf', 'hyresavi.pdf'];
    expect(minaSidor).toHaveBeenCalledWith(
      'errand-1',
      { direction: 'OUTBOUND', body: MESSAGE, author: 'caseworker01' },
      sentFiles.map(name => expect.objectContaining({ originalname: name }) as unknown),
    );
    expect(letter).toHaveBeenCalledWith(
      'applicant-party',
      'Beslut om ekonomiskt bistånd',
      MESSAGE,
      sentFiles.map(filename => expect.objectContaining({ filename }) as unknown),
    );
  });

  it('keeps the beslut on the errand but leaves out what the handläggare took away', async () => {
    const saveOnErrand = vi
      .spyOn(CaremanagementAttachmentService.prototype, 'createAttachment')
      .mockResolvedValue({ data: null, message: 'success' });
    const calculation = vi.spyOn(ErrandLifecareCalculationService.prototype, 'pdf');
    const letter = vi.spyOn(MessagingService.prototype, 'sendLetter').mockResolvedValue();

    await new DecisionNotificationService().send(
      'errand-1',
      { brev: true, message: MESSAGE, includeDecision: false, includeCalculation: false },
      'caseworker01',
    );

    expect(saveOnErrand).toHaveBeenCalledTimes(1);
    expect(calculation).not.toHaveBeenCalled();
    expect(letter).toHaveBeenCalledWith('applicant-party', 'Beslut om ekonomiskt bistånd', MESSAGE, []);
  });
});
