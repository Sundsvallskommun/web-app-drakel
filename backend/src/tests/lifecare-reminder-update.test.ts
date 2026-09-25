import { LifecareEditableReminderRaw, LifecareReminderProposalRaw } from '@interfaces/lifecare-reminder.interface';
import { buildReminderUpdate } from '@utils/lifecare-reminder';
import { describe, expect, it, vi } from 'vitest';

// Today is pinned so the dates below stay in the future however long the tests live.
vi.mock('@utils/swedish-today', () => ({ swedishToday: () => '2026-09-23' }));

const options: LifecareReminderProposalRaw['options'] = {
  reminderReceiverTypes: [{ code: 1, text: 'Handläggare', isActive: true }],
  reminderCaseworkers: [{ id: 'TEST', name: 'Test Handläggare', isCaseworker: true }],
  reminderPriorityTypes: [{ code: 2, text: 'Normal', isActive: true }],
  reminderStatusTypes: [
    { code: 2, text: 'Klar', isActive: true },
    { code: 3, text: 'Ej påbörjad', isActive: true },
  ],
};

/** Bevakning 40 as the editor holds it before the change — the captured body with the old text. */
const current = (): LifecareEditableReminderRaw => ({
  reminderId: 40,
  receiverType: 1,
  objectType: 7083,
  objectTypeName: 'IFO.Insats',
  objectId: '2',
  objectPropertyId: 0,
  mainObjectType: 7083,
  mainObjectId: '2',
  personId: '199001122390',
  personName: 'Jeppson, Test',
  caseworkerId: 'TEST',
  caseworkerName: 'Test Handläggare',
  reminderDate: '2026-09-23',
  status: 3,
  statusText: 'Ej påbörjad',
  priority: 2,
  priorityText: 'Normal',
  type: 3,
  typeText: 'Manuell bevakning insats',
  text: 'Hej',
  startComponent1: 0,
  startComponent2: 0,
  updateTimestamp: '2026-09-23',
  updateSignature: 'lis09bre',
  objectId2: '',
  info: '',
  customerId: 3,
  personIdFormatted: '900112-2390',
});

const change = { reminderDate: '2026-09-23', text: 'Hejsdfdsf', priority: 2, status: 3 };

describe('buildReminderUpdate', () => {
  it('turns a changed text into exactly the captured UpdateReminder body', () => {
    const update = buildReminderUpdate(current(), options, change);

    // POST Reminders/UpdateReminder/ (capture 2026-09-23), field for field and in order.
    const capture = {
      flowable: true,
      isRecurring: false,
      recurringDays: 0,
      coCaseworkerId: '',
      isDateDirty: false,
      ...current(),
      text: 'Hejsdfdsf',
    };
    expect(update.writable ? JSON.stringify(update.body) : update.reason).toBe(JSON.stringify(capture));
  });

  it('marks the date dirty only when it was changed', () => {
    const update = buildReminderUpdate(current(), options, { ...change, reminderDate: '2026-10-01' });

    expect(update.writable && update.body.isDateDirty).toBe(true);
  });

  it('refuses moving the date into the past', () => {
    expect(buildReminderUpdate(current(), options, { ...change, reminderDate: '2026-09-01' }).writable).toBe(false);
  });

  it('still lets an overdue bevakning be marked done without touching its date', () => {
    const overdue = { ...current(), reminderDate: '2026-09-01' };

    expect(buildReminderUpdate(overdue, options, { ...change, reminderDate: '2026-09-01', status: 2 }).writable).toBe(true);
  });

  it('marks a bevakning done with the status and its text', () => {
    const update = buildReminderUpdate(current(), options, { ...change, status: 2 });

    expect(update.writable && [update.body.status, update.body.statusText]).toEqual([2, 'Klar']);
  });

  it('keeps editor fields the bevakning already carries', () => {
    const update = buildReminderUpdate({ ...current(), flowable: false, recurringDays: 7 }, options, change);

    expect(update.writable && [update.body.flowable, update.body.recurringDays]).toEqual([false, 7]);
  });
});
