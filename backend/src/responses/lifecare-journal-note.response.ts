import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from 'class-validator';

import { LifecareNoteType } from '@/data-contracts/caremanagement/data-contracts';
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
  /** Whether a note of this type is write-protected unless the handläggare says otherwise. */
  writeProtectAuto?: boolean;
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
  /** Whether a new note of this type is saved skrivskyddad unless the handläggare says otherwise. */
  @IsBoolean() protectedByDefault!: boolean;
}

export class LifecareNoteTypesApiResponse implements ApiResponse<LifecareNoteTypeView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareNoteTypeView) data!: LifecareNoteTypeView[];
  @IsString() message!: string;
}

/**
 * A note type as careM lists it (the active ones, in Lifecare's order), in the form's shape. careM's contract
 * leaves every field optional; a type careM does not say is skrivskyddad by default is not.
 */
export const toNoteTypeView = (noteType: LifecareNoteType): LifecareNoteTypeView => ({
  code: noteType.code ?? 0,
  name: noteType.name ?? '',
  protectedByDefault: noteType.protectedByDefault ?? false,
});

/** What a handläggare fills in on a new journalanteckning. */
export interface NewJournalNote {
  content: string;
  title?: string;
  occurenceDate?: string;
  occurenceTime?: string;
  /** Saved skrivskyddad; the note type's own default when left out. */
  protected?: boolean;
}

/**
 * Fills Lifecare's blank note with what the handläggare wrote.
 *
 * The rest of the proposal is sent back as Lifecare returned it — its create endpoint takes its own full
 * object, and the blank note already carries the insats it belongs to. Without a rubrik of its own the
 * note is titled by its type, which is what Lifecare's own editor prefills. The time goes in
 * `occurenceTime`, the field Lifecare's editor writes it to; left out, Lifecare stamps the time of saving.
 * `protected` is always sent: a skrivskyddad note can no longer be changed, so it is never left to
 * whatever the blank note happened to carry.
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
  protected: input.protected ?? noteType.writeProtectAuto === true,
  ...(input.occurenceDate ? { occurenceDate: input.occurenceDate } : {}),
  ...(input.occurenceTime ? { occurenceTime: input.occurenceTime } : {}),
});
