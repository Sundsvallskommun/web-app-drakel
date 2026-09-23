import { ApiResponse } from '@interfaces/api-service.interface';
import { LifecareReminderCodeRaw, LifecareReminderListRaw, LifecareReminderProposalRaw } from '@interfaces/lifecare-reminder.interface';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

/** A bevakning in Lifecare, as the sidebar shows it. The personnummer on the row is left behind. */
export class LifecareReminderView {
  @IsNumber() id!: number;
  /** Bevakningsdatum, `YYYY-MM-DD`. */
  @IsString() date!: string;
  @IsString() status!: string;
  @IsNumber() statusCode!: number;
  @IsString() priority!: string;
  @IsNumber() priorityCode!: number;
  /** The kind of bevakning, e.g. "Manuell bevakning insats". */
  @IsString() type!: string;
  /** What it hangs on, e.g. "IFO.Insats" or "IFO.Beslut". */
  @IsString() objectType!: string;
  @IsString() text!: string;
  @IsString() caseworker!: string;
  @IsString() caseworkerId!: string;
}

export class LifecareRemindersApiResponse implements ApiResponse<LifecareReminderView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareReminderView) data!: LifecareReminderView[];
  @IsString() message!: string;
}

/** A coded choice in the bevakning form. */
export class LifecareReminderChoiceView {
  @IsNumber() code!: number;
  @IsString() text!: string;
}

/** The choices for a bevakning — Lifecare's own lists — and what Lifecare proposes for a new one. */
export class LifecareReminderOptionsView {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareReminderChoiceView) priorities!: LifecareReminderChoiceView[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareReminderChoiceView) statuses!: LifecareReminderChoiceView[];
  @IsNumber() defaultPriority!: number;
  @IsNumber() defaultStatus!: number;
}

export class LifecareReminderOptionsApiResponse implements ApiResponse<LifecareReminderOptionsView> {
  @ValidateNested() @Type(() => LifecareReminderOptionsView) data!: LifecareReminderOptionsView;
  @IsString() message!: string;
}

/** The bevakningar, soonest first. */
export const toReminders = (raw: LifecareReminderListRaw): LifecareReminderView[] =>
  raw.reminders
    .map(reminder => ({
      id: reminder.reminderId,
      date: reminder.reminderDate,
      status: reminder.statusText ?? '',
      statusCode: reminder.status,
      priority: reminder.priorityText ?? '',
      priorityCode: reminder.priority,
      type: reminder.typeText ?? '',
      objectType: reminder.objectTypeName ?? '',
      text: reminder.text ?? '',
      caseworker: reminder.caseworkerName ?? reminder.caseworkerId ?? '',
      caseworkerId: reminder.caseworkerId ?? '',
    }))
    .sort((first, second) => first.date.localeCompare(second.date));

const toChoices = (codes: LifecareReminderCodeRaw[]): LifecareReminderChoiceView[] =>
  codes.filter(code => code.isActive).map(code => ({ code: code.code, text: code.text }));

/** The form's choices out of Lifecare's underlag. */
export const toReminderOptions = (proposal: LifecareReminderProposalRaw): LifecareReminderOptionsView => ({
  priorities: toChoices(proposal.options.reminderPriorityTypes),
  statuses: toChoices(proposal.options.reminderStatusTypes),
  defaultPriority: proposal.reminderForAdd.priority,
  defaultStatus: proposal.reminderForAdd.status,
});
