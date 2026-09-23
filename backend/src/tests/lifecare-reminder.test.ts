import { LifecareReminderProposalRaw } from '@interfaces/lifecare-reminder.interface';
import { buildReminderCreate } from '@utils/lifecare-reminder';
import { describe, expect, it, vi } from 'vitest';

import { toReminderOptions, toReminders } from '@/responses/lifecare-reminder.response';

// Today is pinned so the dates below stay in the future however long the tests live.
vi.mock('@utils/swedish-today', () => ({ swedishToday: () => '2026-09-23' }));

const reminderType = (id: number, text: string, objectId: number) => ({ id, text, activeStatus: 1, objectId, isActive: true });

/** Reminders/GetProposalForService?id=2 (capture 2026-09-23), trimmed to one object of each kind. */
const proposal = (): LifecareReminderProposalRaw => ({
  reminderTypeObjects: [
    {
      id: 7012,
      text: 'IFO.Beslut',
      associations: [
        {
          key: 27,
          value: '2026-09-02 : Ek Ekonomiskt bistånd',
          caseworkerId: 'TEST',
          reminderTypes: [reminderType(2, 'Manuell bevakning beslut', 7012)],
        },
      ],
    },
    {
      id: 7083,
      text: 'IFO.Insats',
      associations: [
        {
          key: 2,
          value: '2026-08-26 : EK Ekonomiskt bistånd',
          caseworkerId: 'TEST',
          reminderTypes: [reminderType(3, 'Manuell bevakning insats', 7083)],
        },
      ],
    },
  ],
  options: {
    reminderReceiverTypes: [{ code: 1, text: 'Handläggare', isActive: true }],
    reminderCaseworkers: [
      { id: 'RPA_031DEV', name: 'RPA_031DEV', isCaseworker: true },
      { id: 'TEST', name: 'Test Handläggare', isCaseworker: true },
    ],
    reminderPriorityTypes: [
      { code: 1, text: 'Hög', isActive: true },
      { code: 2, text: 'Normal', isActive: true },
    ],
    reminderStatusTypes: [
      { code: 2, text: 'Klar', isActive: true },
      { code: 3, text: 'Ej påbörjad', isActive: true },
    ],
  },
  reminderForAdd: {
    reminderId: 0,
    receiverType: 1,
    objectType: 0,
    objectTypeName: null,
    objectId: null,
    objectPropertyId: 0,
    mainObjectType: 7083,
    mainObjectId: '2',
    personId: null,
    personName: null,
    caseworkerId: null,
    caseworkerName: null,
    reminderDate: '',
    status: 3,
    statusText: null,
    priority: 2,
    priorityText: null,
    type: 0,
    typeText: null,
    text: null,
    startComponent1: 0,
    startComponent2: 0,
    updateTimestamp: '',
    updateSignature: null,
    objectId2: null,
    info: null,
    customerId: 0,
    personIdFormatted: '',
  },
});

const newReminder = { reminderDate: '2026-09-30', text: 'Kontrollera hyran', priority: 2, status: 3 };
const person = { personId: '199001122390', personName: 'Jeppson, Test' };

describe('buildReminderCreate', () => {
  it('hangs the bevakning on the insats and fills the blank the way the web app does', () => {
    const create = buildReminderCreate(proposal(), newReminder, person);

    // Same fields, order and null/"" mix as the captured CreateReminder body — only on the insats (7083/2)
    // rather than on the beslut the capture happened to pick.
    const expected = {
      reminderId: 0,
      receiverType: 1,
      objectType: 7083,
      objectTypeName: 'IFO.Insats',
      objectId: 2,
      objectPropertyId: 0,
      mainObjectType: 7083,
      mainObjectId: '2',
      personId: '199001122390',
      personName: 'Jeppson, Test',
      caseworkerId: 'TEST',
      caseworkerName: 'Test Handläggare',
      reminderDate: '2026-09-30',
      status: 3,
      statusText: null,
      priority: 2,
      priorityText: null,
      type: 3,
      typeText: 'Manuell bevakning insats',
      text: 'Kontrollera hyran',
      startComponent1: 0,
      startComponent2: 0,
      updateTimestamp: '',
      updateSignature: null,
      objectId2: null,
      info: null,
      customerId: 0,
      personIdFormatted: '',
    };
    expect(create.writable ? JSON.stringify(create.body) : create.reason).toBe(JSON.stringify(expected));
  });

  it('refuses a date in the past but takes today', () => {
    expect(buildReminderCreate(proposal(), { ...newReminder, reminderDate: '2026-09-22' }, person).writable).toBe(false);
    expect(buildReminderCreate(proposal(), { ...newReminder, reminderDate: '2026-09-23' }, person).writable).toBe(true);
  });

  it('refuses when the insats has no handläggare to be "bevakad av"', () => {
    const withoutCaseworker = proposal();
    const insats = withoutCaseworker.reminderTypeObjects[1]?.associations[0];
    if (insats) {
      insats.caseworkerId = '';
    }

    expect(buildReminderCreate(withoutCaseworker, newReminder, person).writable).toBe(false);
  });

  it('refuses when Lifecare offers no manual insats bevakning', () => {
    const onlyBeslut = proposal();
    onlyBeslut.reminderTypeObjects = onlyBeslut.reminderTypeObjects.filter(objectType => objectType.text !== 'IFO.Insats');

    expect(buildReminderCreate(onlyBeslut, newReminder, person).writable).toBe(false);
  });

  it('refuses a priority or status Lifecare does not offer', () => {
    expect(buildReminderCreate(proposal(), { ...newReminder, priority: 9 }, person).writable).toBe(false);
    expect(buildReminderCreate(proposal(), { ...newReminder, status: 9 }, person).writable).toBe(false);
  });
});

describe('toReminders', () => {
  it('lists the bevakningar soonest first, without the personnummer', () => {
    const reminder = {
      reminderId: 38,
      reminderDate: '2026-09-23',
      status: 3,
      statusText: 'Ej påbörjad',
      priority: 2,
      priorityText: 'Normal',
      personId: '199001122390',
      personName: 'Jeppson, Test',
      caseworkerId: 'TEST',
      caseworkerName: 'Test Handläggare',
      type: 2,
      typeText: 'Manuell bevakning beslut',
      text: 'test av text',
      objectType: 7012,
      objectTypeName: 'IFO.Beslut',
    };

    const reminders = toReminders({ reminders: [{ ...reminder, reminderId: 39, reminderDate: '2026-10-01' }, reminder] });

    expect(reminders.map(view => view.id)).toEqual([38, 39]);
    expect(reminders[0]).toEqual({
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
    });
  });
});

describe('toReminderOptions', () => {
  it('offers the priorities and statuses Lifecare lists, and proposes its defaults', () => {
    const options = toReminderOptions(proposal());

    expect(options.priorities.map(choice => choice.text)).toEqual(['Hög', 'Normal']);
    expect(options.defaultPriority).toBe(2);
    expect(options.defaultStatus).toBe(3);
  });
});
