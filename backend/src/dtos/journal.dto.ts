import { IsOptional, IsString } from 'class-validator';

/** The fields a handläggare sends when creating a journalanteckning (createdBy comes from auth). */
export class CreateJournalEntryDto {
  /** Journal entry type (Lifecare 'Typ'); the Swedish label from the type catalogue. */
  @IsString()
  type!: string;

  /** Heading (Lifecare 'Rubrik'). */
  @IsString()
  heading!: string;

  /** Free-text body of the entry. */
  @IsString()
  @IsOptional()
  text?: string;

  /** Documented date and time (Lifecare 'Datum'/'Tid') as an ISO offset date-time, e.g. 2025-05-30T14:30:00+02:00. */
  @IsString()
  entryDateTime!: string;
}

/** The fields a handläggare sends when editing a (still WORKING) journalanteckning. */
export class UpdateJournalEntryDto {
  @IsString()
  type!: string;

  @IsString()
  heading!: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  entryDateTime!: string;
}
