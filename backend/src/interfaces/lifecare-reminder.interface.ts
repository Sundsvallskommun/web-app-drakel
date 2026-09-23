/** One bevakning as Lifecare's `ListRemindersByServiceId` lists it. Carries the personnummer — never log it. */
interface LifecareReminderRaw {
  reminderId: number;
  reminderDate: string;
  status: number;
  statusText: string | null;
  priority: number;
  priorityText: string | null;
  personId: string | null;
  personName: string | null;
  caseworkerId: string | null;
  caseworkerName: string | null;
  type: number;
  typeText: string | null;
  text: string | null;
  objectType: number;
  objectTypeName: string | null;
}

/** `ListRemindersByServiceId`: the bevakningar on the insats and on what hangs under it (beslut, aktualiseringar). */
export interface LifecareReminderListRaw {
  reminders: LifecareReminderRaw[];
}

/** A kind of bevakning Lifecare allows on an object, e.g. `3` "Manuell bevakning insats". */
interface LifecareReminderTypeRaw {
  id: number;
  text: string;
  isActive: boolean;
}

/** One object a bevakning can hang on — `key` is the object's id, e.g. the insats's service id. */
interface LifecareReminderAssociationRaw {
  key: number;
  value: string;
  /** The object's own handläggare — for the insats, who its bevakningar are "bevakade av". */
  caseworkerId: string;
  reminderTypes: LifecareReminderTypeRaw[];
}

/** An object type bevakningar can hang on, e.g. `7083` "IFO.Insats", with the objects of that type. */
interface LifecareReminderObjectTypeRaw {
  id: number;
  text: string;
  associations: LifecareReminderAssociationRaw[];
}

/** A coded choice in the bevakning form (receiver type, priority, status). */
export interface LifecareReminderCodeRaw {
  code: number;
  text: string;
  isActive: boolean;
}

/** A handläggare a bevakning can be addressed to. */
interface LifecareReminderCaseworkerRaw {
  id: string;
  name: string;
  isCaseworker: boolean;
}

/**
 * A bevakning in the shape Lifecare's editor works on (`GetReminderEditComposite`'s `reminder`) — the
 * object `UpdateReminder` takes back. Only the fields drakel reads are named; the rest is carried along.
 */
export interface LifecareEditableReminderRaw {
  reminderId: number;
  reminderDate: string;
  [field: string]: unknown;
}

/** `GetReminderEditComposite`: one bevakning as Lifecare's editor opens it. */
export interface LifecareReminderEditCompositeRaw {
  reminder: LifecareEditableReminderRaw;
}

/**
 * Lifecare's underlag for a new bevakning on an insats (`Reminders/GetProposalForService`): what it can
 * hang on, the form's choices, and the blank bevakning `CreateReminder` takes back filled in. Only the
 * parts drakel reads are named; the rest is carried along untouched.
 */
export interface LifecareReminderProposalRaw {
  reminderTypeObjects: LifecareReminderObjectTypeRaw[];
  options: {
    reminderReceiverTypes: LifecareReminderCodeRaw[];
    reminderCaseworkers: LifecareReminderCaseworkerRaw[];
    reminderPriorityTypes: LifecareReminderCodeRaw[];
    reminderStatusTypes: LifecareReminderCodeRaw[];
  };
  reminderForAdd: { status: number; priority: number; [field: string]: unknown };
}
