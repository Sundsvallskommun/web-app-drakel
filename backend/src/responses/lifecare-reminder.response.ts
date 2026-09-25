import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

import { LifecareReminder, LifecareReminderChoice, LifecareReminderOptions } from '@/data-contracts/caremanagement/data-contracts';

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

/**
 * A bevakning as careM lists it, in the sidebar's shape. careM's contract leaves every field optional; one it
 * leaves out is shown empty (or 0) rather than dropping the row.
 */
export const toReminderView = (reminder: LifecareReminder): LifecareReminderView => ({
  id: reminder.id ?? 0,
  date: reminder.date ?? '',
  status: reminder.status ?? '',
  statusCode: reminder.statusCode ?? 0,
  priority: reminder.priority ?? '',
  priorityCode: reminder.priorityCode ?? 0,
  type: reminder.type ?? '',
  objectType: reminder.objectType ?? '',
  text: reminder.text ?? '',
  caseworker: reminder.caseworker ?? '',
  caseworkerId: reminder.caseworkerId ?? '',
});

const toChoiceView = (choice: LifecareReminderChoice): LifecareReminderChoiceView => ({
  code: choice.code ?? 0,
  text: choice.text ?? '',
});

/** The bevakning form's choices as careM lists them, in the form's shape. */
export const toReminderOptionsView = (options: LifecareReminderOptions): LifecareReminderOptionsView => ({
  priorities: (options.priorities ?? []).map(toChoiceView),
  statuses: (options.statuses ?? []).map(toChoiceView),
  defaultPriority: options.defaultPriority ?? 0,
  defaultStatus: options.defaultStatus ?? 0,
});
