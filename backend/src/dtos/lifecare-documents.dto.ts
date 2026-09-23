import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * The edits a handläggare makes to a Lifecare journalanteckning or document.
 *
 * Only these three fields are the caller's to change; everything else on the Lifecare object is
 * round-tripped untouched (see {@link LifecareDocumentsService}). The date and time are Lifecare's
 * own field shapes — a plain `YYYY-MM-DD` date and `HH:mm` time, not an ISO offset date-time.
 */
export class UpdateLifecareRecordDto {
  /** The record body as HTML, e.g. `<p>…</p>`. */
  @IsString()
  @MaxLength(1048576)
  content!: string;

  /** Documented date, `YYYY-MM-DD`. */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'occurenceDate must be YYYY-MM-DD' })
  @IsOptional()
  occurenceDate?: string;

  /** Documented time, `HH:mm`. */
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'time must be HH:mm' })
  @IsOptional()
  time?: string;
}

/**
 * A new journalanteckning, written straight to the errand's insats in Lifecare. The note type is
 * Lifecare's own (`noteTypeCode` from the note-types endpoint); the rubrik defaults to its name.
 */
export class CreateLifecareJournalNoteDto {
  /** The note body as HTML. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(1048576)
  content!: string;

  /** Lifecare's noteTypeCode, e.g. 1 for Journalanteckning. */
  @IsInt()
  noteTypeCode!: number;

  /** The rubrik; the note type's name when left out. */
  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  /** Documented time, `HH:mm`; Lifecare stamps the time of saving when left out. */
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'occurenceTime must be HH:mm' })
  @IsOptional()
  occurenceTime?: string;

  /** Documented date, `YYYY-MM-DD`; Lifecare's proposal (today) when left out. */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'occurenceDate must be YYYY-MM-DD' })
  @IsOptional()
  occurenceDate?: string;
}

/**
 * A new document, written straight to the errand's insats in Lifecare. The document type is Lifecare's
 * own (`documentTypeCode` from the document-types endpoint); the rubrik defaults to its name.
 */
export class CreateLifecareDocumentDto {
  /** The document body as HTML. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(1048576)
  content!: string;

  /** Lifecare's documentTypeCode, e.g. 1 for EK Brev. */
  @IsInt()
  documentTypeCode!: number;

  /** The rubrik; the document type's name when left out. */
  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  /** Documented date, `YYYY-MM-DD`; Lifecare's proposal (today) when left out or fixed by the type. */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'occurenceDate must be YYYY-MM-DD' })
  @IsOptional()
  occurenceDate?: string;
}
