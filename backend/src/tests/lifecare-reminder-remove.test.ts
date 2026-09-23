import { LifecareReminderListRaw } from '@interfaces/lifecare-reminder.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import ErrandLifecareRemindersService from '@services/errand-lifecare-reminders.service';
import LifecareRemindersService from '@services/lifecare-reminders.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Bevakning 12 as Lifecare lists it on the insats. */
const reminderOnInsats: LifecareReminderListRaw['reminders'][number] = {
  reminderId: 12,
  reminderDate: '2026-09-23',
  status: 3,
  statusText: 'Ej påbörjad',
  priority: 2,
  priorityText: 'Normal',
  personId: '199001122390',
  personName: 'Jeppson, Test',
  caseworkerId: 'TEST',
  caseworkerName: 'Test Handläggare',
  type: 3,
  typeText: 'Manuell bevakning insats',
  text: 'Hej',
  objectType: 7083,
  objectTypeName: 'IFO.Insats',
};

describe('ErrandLifecareRemindersService.remove', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
      data: { lifecareServiceId: 2 },
      message: 'success',
    });
    vi.spyOn(LifecareRemindersService.prototype, 'listByService').mockResolvedValue({ reminders: [reminderOnInsats] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes the bevakning and logs it on the errand', async () => {
    const remove = vi.spyOn(LifecareRemindersService.prototype, 'remove').mockResolvedValue();
    const report = vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();

    await new ErrandLifecareRemindersService().remove('errand-1', 12);

    expect(remove).toHaveBeenCalledWith(12);
    expect(report.mock.calls[0]?.[1]).toMatchObject([{ action: 'DELETE', target: 'REMINDER', lifecareId: '12' }]);
  });

  it('refuses a bevakning that is not on the insats of the errand', async () => {
    const remove = vi.spyOn(LifecareRemindersService.prototype, 'remove');

    await expect(new ErrandLifecareRemindersService().remove('errand-1', 99)).rejects.toMatchObject({ status: 404 });
    expect(remove).not.toHaveBeenCalled();
  });
});
