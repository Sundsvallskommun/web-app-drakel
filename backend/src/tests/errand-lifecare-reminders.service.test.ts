import CaremanagementApiService from '@services/caremanagement-api.service';
import ErrandLifecareRemindersService from '@services/errand-lifecare-reminders.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LifecareReminder } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const REMINDERS_URL = caremanagementLifecareUrl('errand-1', 'reminders');

/** Bevakning 38 as careM lists it. */
const reminder: LifecareReminder = {
  id: 38,
  date: '2026-09-23',
  status: 'Ej påbörjad',
  statusCode: 3,
  priority: 'Normal',
  priorityCode: 2,
  type: 'Manuell bevakning beslut',
  objectType: 'IFO.Beslut',
  text: 'test av text',
  caseworker: 'Test Handläggare',
  caseworkerId: 'TEST',
};

const change = { reminderDate: '2026-09-30', text: 'Kontrollera hyran', priority: 2, status: 3 };

describe('ErrandLifecareRemindersService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the insats's bevakningar from careM, in careM's order", async () => {
    const later = { ...reminder, id: 39, date: '2026-10-01' };
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: [reminder, later], message: 'success', status: 200 });

    expect(await new ErrandLifecareRemindersService().list('errand-1')).toEqual([reminder, later]);
    expect(get).toHaveBeenCalledWith({ url: REMINDERS_URL });
  });

  it('shows a field careM leaves out as empty rather than dropping the bevakning', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({
      data: [{ id: 40, date: '2026-09-24' }],
      message: 'success',
      status: 200,
    });

    expect(await new ErrandLifecareRemindersService().list('errand-1')).toEqual([
      {
        id: 40,
        date: '2026-09-24',
        status: '',
        statusCode: 0,
        priority: '',
        priorityCode: 0,
        type: '',
        objectType: '',
        text: '',
        caseworker: '',
        caseworkerId: '',
      },
    ]);
  });

  it("reads the form's choices from careM", async () => {
    const options = {
      priorities: [{ code: 1, text: 'Hög' }],
      statuses: [{ code: 3, text: 'Ej påbörjad' }],
      defaultPriority: 1,
      defaultStatus: 3,
    };
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: options, message: 'success', status: 200 });

    expect(await new ErrandLifecareRemindersService().options('errand-1')).toEqual(options);
    expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'reminders', 'options') });
  });

  it('adds a bevakning through careM, which answers 201 without a body', async () => {
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue({ data: '', message: 'success', status: 201 });

    await expect(new ErrandLifecareRemindersService().create('errand-1', change)).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith({ url: REMINDERS_URL, data: change });
  });

  it('changes a bevakning through careM, which answers 204', async () => {
    const put = vi.spyOn(CaremanagementApiService.prototype, 'put').mockResolvedValue({ data: '', message: 'success', status: 204 });

    await expect(new ErrandLifecareRemindersService().update('errand-1', 40, change)).resolves.toBeUndefined();
    expect(put).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'reminders', '40'), data: change });
  });

  it('removes a bevakning through careM, which answers 204', async () => {
    const remove = vi.spyOn(CaremanagementApiService.prototype, 'delete').mockResolvedValue({ data: '', message: 'success', status: 204 });

    await expect(new ErrandLifecareRemindersService().remove('errand-1', 12)).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'reminders', '12') });
  });

  it("passes on careM's refusal of a bevakning that is not on the errand's insats", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'put').mockRejectedValue(new HttpException(404, 'Not found'));

    await expect(new ErrandLifecareRemindersService().update('errand-1', 99, change)).rejects.toMatchObject({ status: 404 });
  });

  it("passes on careM's refusal when the errand has no Lifecare insats yet", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockRejectedValue(new HttpException(409, 'The errand has no Lifecare insats'));

    await expect(new ErrandLifecareRemindersService().list('errand-1')).rejects.toMatchObject({ status: 409 });
  });
});
