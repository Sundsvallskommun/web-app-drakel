import { LifecareEditableReminderRaw, LifecareReminderProposalRaw } from '@interfaces/lifecare-reminder.interface';
import { swedishToday } from '@utils/swedish-today';

// Every drakel errand is one insats, and a bevakning made from drakel is a manual one on the insats itself.
const INSATS_OBJECT_TYPE = 'IFO.Insats';
const INSATS_REMINDER_TYPE = 'Manuell bevakning insats';

/** A bevakning as the handläggare fills it in. It is always "bevakad av" the insats's handläggare. */
export interface NewLifecareReminder {
  /** Bevakningsdatum, `YYYY-MM-DD` — not before today. */
  reminderDate: string;
  text: string;
  priority: number;
  status: number;
}

/** The person the bevakning concerns, as Lifecare names them: personnummer and "Efternamn, Förnamn". */
export interface ReminderPerson {
  personId: string;
  personName: string;
}

/** Either the body to send to Lifecare, or why the bevakning cannot be saved as it stands. */
type ReminderWrite = { writable: true; body: Record<string, unknown> } | { writable: false; reason: string };

const refuse = (reason: string): ReminderWrite => ({ writable: false, reason });

const PAST_DATE = 'Bevakningsdatumet kan inte ligga bakåt i tiden.';

type ReminderOptionsRaw = LifecareReminderProposalRaw['options'];

/** The priority and status picked, with the texts Lifecare gives them — or why one is not in its lists. */
const resolveCodes = (options: ReminderOptionsRaw, reminder: NewLifecareReminder): { priorityText: string; statusText: string } | string => {
  const priority = options.reminderPriorityTypes.find(candidate => candidate.code === reminder.priority && candidate.isActive);
  const status = options.reminderStatusTypes.find(candidate => candidate.code === reminder.status && candidate.isActive);
  if (!priority || !status) {
    return 'Prioriteten eller statusen finns inte i Lifecare.';
  }
  return { priorityText: priority.text, statusText: status.text };
};

/**
 * Builds the `CreateReminder` body the way Lifecare's web app does (capture 2026-09-23): the underlag's
 * blank bevakning, filled in, in its own field order.
 *
 * The bevakning is always an IFO.Insats one of the kind "Manuell bevakning insats", on the insats the
 * underlag was asked for (`mainObjectType`/`mainObjectId` on its blank bevakning). It is "bevakad av"
 * Handläggare — the insats's own handläggare in Lifecare — and its date may not be in the past.
 */
export const buildReminderCreate = (proposal: LifecareReminderProposalRaw, reminder: NewLifecareReminder, person: ReminderPerson): ReminderWrite => {
  if (reminder.reminderDate < swedishToday()) {
    return refuse(PAST_DATE);
  }

  const blank = proposal.reminderForAdd;
  const objectId = Number(blank.mainObjectId);
  const objectType = proposal.reminderTypeObjects.find(
    candidate => candidate.id === Number(blank.mainObjectType) && candidate.text === INSATS_OBJECT_TYPE,
  );
  const insats = objectType?.associations.find(candidate => candidate.key === objectId);
  const reminderType = insats?.reminderTypes.find(candidate => candidate.isActive && candidate.text === INSATS_REMINDER_TYPE);
  if (!objectType || !insats || !reminderType) {
    return refuse('Lifecare tillåter ingen manuell bevakning på insatsen.');
  }
  if (!insats.caseworkerId) {
    return refuse('Insatsen har ingen handläggare i Lifecare som kan bevaka.');
  }

  const codes = resolveCodes(proposal.options, reminder);
  if (typeof codes === 'string') {
    return refuse(codes);
  }
  const caseworkerName = proposal.options.reminderCaseworkers.find(candidate => candidate.id === insats.caseworkerId)?.name ?? insats.caseworkerId;

  // Assigning onto a copy keeps each field where the blank bevakning had it.
  const body: Record<string, unknown> = { ...blank };
  body.objectType = objectType.id;
  body.objectTypeName = objectType.text;
  body.objectId = objectId;
  body.personId = person.personId;
  body.personName = person.personName;
  body.caseworkerId = insats.caseworkerId;
  body.caseworkerName = caseworkerName;
  body.reminderDate = reminder.reminderDate;
  body.status = reminder.status;
  body.priority = reminder.priority;
  body.type = reminderType.id;
  body.typeText = reminderType.text;
  body.text = reminder.text;
  return { writable: true, body };
};

/**
 * Builds the `UpdateReminder` body the way Lifecare's web app does (capture 2026-09-23): the bevakning as
 * its editor opened it, with the handläggare's changes to date, text, priority and status. Who it is
 * "bevakad av" is left as it is. The object keeps Lifecare's own editor shape — `objectId` as a string,
 * `objectId2` and `info` as empty strings — since it is the editor's object that goes back. Marking a
 * bevakning done is this same update with the status "Klar".
 *
 * A changed date may not be in the past; an unchanged one may, so an overdue bevakning can still be
 * marked done.
 *
 * The capture starts with five editor fields (`flowable`, `isRecurring`, `recurringDays`,
 * `coCaseworkerId`, `isDateDirty`). Whether the editor object already carries them is not captured, so
 * they are taken from it when it does and set to the captured values when it does not — except
 * `isDateDirty`, which says whether the date was changed.
 */
export const buildReminderUpdate = (
  current: LifecareEditableReminderRaw,
  options: ReminderOptionsRaw,
  reminder: NewLifecareReminder,
): ReminderWrite => {
  const dateChanged = current.reminderDate !== reminder.reminderDate;
  if (dateChanged && reminder.reminderDate < swedishToday()) {
    return refuse(PAST_DATE);
  }
  const codes = resolveCodes(options, reminder);
  if (typeof codes === 'string') {
    return refuse(codes);
  }

  const body: Record<string, unknown> = {
    flowable: current.flowable ?? true,
    isRecurring: current.isRecurring ?? false,
    recurringDays: current.recurringDays ?? 0,
    coCaseworkerId: current.coCaseworkerId ?? '',
    isDateDirty: dateChanged,
    ...current,
  };
  body.isDateDirty = dateChanged;
  body.reminderDate = reminder.reminderDate;
  body.status = reminder.status;
  body.statusText = codes.statusText;
  body.priority = reminder.priority;
  body.priorityText = codes.priorityText;
  body.text = reminder.text;
  return { writable: true, body };
};
