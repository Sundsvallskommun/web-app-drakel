import CaremanagementMessageService from '@services/caremanagement-message.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import DecisionNotificationService from '@services/decision-notification.service';
import MessagingService from '@services/messaging.service';
import { logger } from '@utils/logger';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

const MESSAGE = '<p>Hej,</p><p>Din ansökan för september 2026 är klar. Se bifogade dokument.</p>';
const decision = { buffer: Buffer.from('%PDF-beslut'), originalname: 'beslut-EB-26090039.pdf', mimetype: 'application/pdf' };
const ownFile = { buffer: Buffer.from('%PDF-own'), originalname: 'hyresavi.pdf', mimetype: 'application/pdf' };
const input = { meddelande: true, brev: true, message: MESSAGE, includeDecision: true, includeCalculation: false, lifecareDocumentIds: [] };

describe('DecisionNotificationService.send', () => {
  let applicantPartyId: MockInstance<CaremanagementStakeholderService['readApplicantPartyId']>;

  beforeEach(() => {
    applicantPartyId = vi.spyOn(CaremanagementStakeholderService.prototype, 'readApplicantPartyId').mockResolvedValue('applicant-party');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the handläggare's message with the same documents as a meddelande and as a brev", async () => {
    const conversation = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const letter = vi.spyOn(MessagingService.prototype, 'sendLetter').mockResolvedValue();

    const failed = await new DecisionNotificationService().send('errand-1', input, 'caseworker01', [decision, ownFile]);

    expect(failed).toEqual([]);
    expect(conversation).toHaveBeenCalledWith('errand-1', { direction: 'OUTBOUND', body: MESSAGE, author: 'caseworker01' }, [decision, ownFile]);
    expect(letter).toHaveBeenCalledWith('applicant-party', 'Beslut om ekonomiskt bistånd', MESSAGE, [
      { filename: 'beslut-EB-26090039.pdf', content: decision.buffer.toString('base64') },
      { filename: 'hyresavi.pdf', content: ownFile.buffer.toString('base64') },
    ]);
  });

  it('sends only through the channels chosen, and reports the ones that failed', async () => {
    const conversation = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage');
    vi.spyOn(MessagingService.prototype, 'sendLetter').mockRejectedValue(new Error('Messaging svarade inte'));

    const failed = await new DecisionNotificationService().send('errand-1', { ...input, meddelande: false }, 'caseworker01', [decision]);

    expect(conversation).not.toHaveBeenCalled();
    expect(failed).toEqual(['Brev']);
  });

  it('fails only the brev when the sökande cannot be looked up — the meddelande does not need them', async () => {
    applicantPartyId.mockRejectedValue(new HttpException(502, 'careM svarade inte'));
    const conversation = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const letter = vi.spyOn(MessagingService.prototype, 'sendLetter');

    const failed = await new DecisionNotificationService().send('errand-1', input, 'caseworker01', [decision]);

    expect(failed).toEqual(['Brev']);
    expect(conversation).toHaveBeenCalled();
    expect(letter).not.toHaveBeenCalled();
  });

  it('sends no brev to an errand without a sökande', async () => {
    applicantPartyId.mockResolvedValue(undefined);
    const letter = vi.spyOn(MessagingService.prototype, 'sendLetter');

    const failed = await new DecisionNotificationService().send('errand-1', { ...input, meddelande: false }, 'caseworker01', [decision]);

    expect(failed).toEqual(['Brev']);
    expect(letter).not.toHaveBeenCalled();
  });

  it('logs each failed channel by errand, channel and status — never the message or the sökande', async () => {
    vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockRejectedValue(new HttpException(413, 'Uploaded file is too large'));
    vi.spyOn(MessagingService.prototype, 'sendLetter').mockResolvedValue();
    const warn = vi.spyOn(logger, 'warn');

    await new DecisionNotificationService().send('errand-1', input, 'caseworker01', [decision]);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/errand-1.*Meddelande.*413/));
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('applicant-party'));
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Hej'));
  });
});
