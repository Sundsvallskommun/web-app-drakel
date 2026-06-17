import { MessageController } from '@controllers/message.controller';
import { RequestWithUser } from '@interfaces/auth.interface';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

const request = {
  user: {
    username: 'caseworker01',
    name: 'Case Worker',
    givenName: 'Case',
    surname: 'Worker',
    groups: ['caseworkers'],
    role: 'app_read',
    permissions: { canEditErrands: true },
  },
} as unknown as RequestWithUser;

describe('MessageController.createMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('trims the message body before sending it to caremanagement', async () => {
    const createMessage = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const controller = new MessageController();

    await expect(controller.createMessage(request, 'errand-1', '  Hej  ', [])).resolves.toEqual({ data: null, message: 'success' });

    expect(createMessage).toHaveBeenCalledWith('errand-1', { direction: 'OUTBOUND', body: 'Hej', author: 'caseworker01' }, []);
  });

  it('forwards inReplyToId when the message is a reply', async () => {
    const createMessage = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const controller = new MessageController();

    await expect(controller.createMessage(request, 'errand-1', 'Svar', [], 'message-42')).resolves.toEqual({ data: null, message: 'success' });

    expect(createMessage).toHaveBeenCalledWith(
      'errand-1',
      { direction: 'OUTBOUND', body: 'Svar', author: 'caseworker01', inReplyToId: 'message-42' },
      [],
    );
  });

  it('omits a blank inReplyToId so the message is posted as a non-reply', async () => {
    const createMessage = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const controller = new MessageController();

    await expect(controller.createMessage(request, 'errand-1', 'Hej', [], '   ')).resolves.toEqual({ data: null, message: 'success' });

    expect(createMessage).toHaveBeenCalledWith('errand-1', { direction: 'OUTBOUND', body: 'Hej', author: 'caseworker01' }, []);
  });

  it('rejects an empty message body before calling caremanagement', async () => {
    const createMessage = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const controller = new MessageController();

    await expect(controller.createMessage(request, 'errand-1', '   ', [])).rejects.toMatchObject({ status: 400 });

    expect(createMessage).not.toHaveBeenCalled();
  });

  it('rejects a too long message body before calling caremanagement', async () => {
    const createMessage = vi.spyOn(CaremanagementMessageService.prototype, 'createMessage').mockResolvedValue({ data: null, message: 'success' });
    const controller = new MessageController();

    await expect(controller.createMessage(request, 'errand-1', 'x'.repeat(8193), [])).rejects.toMatchObject({ status: 400 });

    expect(createMessage).not.toHaveBeenCalled();
  });
});
