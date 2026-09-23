import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

import { LifecareEditableRecord } from '@/responses/lifecare-documents.response';

/**
 * One journal note type as Lifecare's `GetNoteProposalForService` lists it — only the fields drakel
 * reads. Lifecare's own names: `id` is the `noteTypeCode` a new note carries, `name` its title.
 * @public
 */
export interface LifecareNoteTypeRaw {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Lifecare's proposal for a new journal note on an insats: the selectable note types, and a blank note
 * already bound to the insats (`ownerId` = the service id, `ownerType` 53) that its own editor fills in
 * and posts to `CreateJournalNote`.
 * @public
 */
export interface LifecareNoteProposalRaw {
  documentNoteTypes: LifecareNoteTypeRaw[];
  documentJournalNote: LifecareEditableRecord;
}

/** A note type a handläggare can pick for a new journalanteckning. */
export class LifecareNoteTypeView {
  /** Lifecare's noteTypeCode. */
  @IsNumber() code!: number;
  @IsString() name!: string;
}

export class LifecareNoteTypesApiResponse implements ApiResponse<LifecareNoteTypeView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareNoteTypeView) data!: LifecareNoteTypeView[];
  @IsString() message!: string;
}

/** The active note types, in Lifecare's own order. */
export const toNoteTypes = (proposal: LifecareNoteProposalRaw): LifecareNoteTypeView[] =>
  proposal.documentNoteTypes
    .filter(noteType => noteType.isActive)
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map(noteType => ({ code: noteType.id, name: noteType.name }));

/** What a handläggare fills in on a new journalanteckning. */
export interface NewJournalNote {
  content: string;
  title?: string;
  occurenceDate?: string;
  occurenceTime?: string;
}

/**
 * Fills Lifecare's blank note with what the handläggare wrote.
 *
 * The rest of the proposal is sent back as Lifecare returned it — its create endpoint takes its own full
 * object, and the blank note already carries the insats it belongs to. Without a rubrik of its own the
 * note is titled by its type, which is what Lifecare's own editor prefills. The time goes in
 * `occurenceTime`, the field Lifecare's editor writes it to; left out, Lifecare stamps the time of saving.
 */
export const buildJournalNote = (
  proposal: LifecareNoteProposalRaw,
  noteType: LifecareNoteTypeRaw,
  input: NewJournalNote,
): LifecareEditableRecord => ({
  ...proposal.documentJournalNote,
  content: input.content,
  title: input.title?.trim() ? input.title.trim() : noteType.name,
  noteTypeCode: noteType.id,
  ...(input.occurenceDate ? { occurenceDate: input.occurenceDate } : {}),
  ...(input.occurenceTime ? { occurenceTime: input.occurenceTime } : {}),
});
